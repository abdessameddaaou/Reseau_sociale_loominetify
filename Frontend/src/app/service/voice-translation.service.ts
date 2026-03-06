import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SocketService } from './socket.service';

export type SupportedLang = 'fr' | 'id';

export interface TranslationEntry {
    originalText: string;
    translatedText: string;
    sourceLang: SupportedLang;
    targetLang: SupportedLang;
    fromUserId: number;
    timestamp: Date;
    isMine: boolean;
    isError?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VoiceTranslationService implements OnDestroy {

    isActive$ = new BehaviorSubject<boolean>(false);
    isListening$ = new BehaviorSubject<boolean>(false);
    transcriptions$ = new BehaviorSubject<TranslationEntry[]>([]);
    myLanguage$ = new BehaviorSubject<SupportedLang>('fr');

    private conversationId: number | null = null;
    private userId: number | null = null;
    private subs: Subscription[] = [];
    private recognition: any = null;
    private mediaRecorder: MediaRecorder | null = null;
    private autoTranslationStream: MediaStream | null = null;

    /** Traduction audio automatique en cours ? */
    autoTranslationActive$ = new BehaviorSubject<boolean>(false);

    private readonly MAX_ENTRIES = 30;
    private readonly LANG_CODES: Record<SupportedLang, string> = {
        fr: 'fr-FR',
        id: 'id-ID'
    };

    /** TTS activée ? */
    ttsEnabled$ = new BehaviorSubject<boolean>(true);

    constructor(private socketService: SocketService) {
        this.listenToIncomingTranslations();
    }

    // ═══════════════════════════════════════
    //  API publique
    // ═══════════════════════════════════════

    start(conversationId: number, userId: number, myLang: SupportedLang = 'fr') {
        if (this.isActive$.value) return;
        this.conversationId = conversationId;
        this.userId = userId;
        this.myLanguage$.next(myLang);
        this.isActive$.next(true);
        this.transcriptions$.next([]);
    }

    stop() {
        this.isActive$.next(false);
        this.isListening$.next(false);
        this.stopRecognition();
        this.stopAutoTranslation();
    }

    toggleLanguage() {
        const next: SupportedLang = this.myLanguage$.value === 'fr' ? 'id' : 'fr';
        this.myLanguage$.next(next);
    }

    toggleTts() {
        this.ttsEnabled$.next(!this.ttsEnabled$.value);
    }

    /** Envoie un texte tapé par l'utilisateur pour traduction. */
    sendText(text: string) {
        if (!text || !text.trim() || this.conversationId === null) return;
        this.emitTranslation(text.trim());
    }

    // ═══════════════════════════════════════
    //  Traduction audio automatique (MediaRecorder → STT → Translate)
    // ═══════════════════════════════════════

    /** Démarre la capture audio automatique sur le stream local. */
    startAutoTranslation(localStream: MediaStream) {
        if (this.autoTranslationActive$.value) {
            this.stopAutoTranslation();
            return;
        }

        if (!localStream) {
            console.warn('[VoiceTranslation] Pas de stream local disponible');
            return;
        }

        // Extraire uniquement les pistes audio
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length === 0) {
            console.warn('[VoiceTranslation] Pas de piste audio dans le stream');
            return;
        }

        this.autoTranslationStream = new MediaStream(audioTracks);

        try {
            const recorder = new MediaRecorder(this.autoTranslationStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            this.mediaRecorder = recorder;

            recorder.ondataavailable = async (event) => {
                if (event.data.size === 0 || !this.autoTranslationActive$.value) return;
                if (this.conversationId === null) return;

                try {
                    // Convertir le blob en base64
                    const base64 = await this.blobToBase64(event.data);
                    const myLang = this.myLanguage$.value;
                    const targetLang: SupportedLang = myLang === 'fr' ? 'id' : 'fr';

                    console.log(`[VoiceTranslation] 🎤 Envoi chunk audio (${(event.data.size / 1024).toFixed(1)}KB)`);

                    this.socketService.emitAudioChunk({
                        conversationId: this.conversationId!,
                        audio: base64,
                        sourceLang: myLang,
                        targetLang
                    });
                } catch (err) {
                    console.error('[VoiceTranslation] Erreur conversion audio:', err);
                }
            };

            recorder.onstart = () => {
                console.log('[VoiceTranslation] 🎤 Capture audio démarrée');
                this.autoTranslationActive$.next(true);
            };

            recorder.onstop = () => {
                console.log('[VoiceTranslation] 🎤 Capture audio arrêtée');
            };

            // Enregistrer des segments de 3.5 secondes
            recorder.start(3500);

        } catch (err) {
            console.error('[VoiceTranslation] Erreur MediaRecorder:', err);
            this.autoTranslationActive$.next(false);
        }
    }

    stopAutoTranslation() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try { this.mediaRecorder.stop(); } catch (_) { }
        }
        this.mediaRecorder = null;
        this.autoTranslationStream = null;
        this.autoTranslationActive$.next(false);
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                // Retirer le préfixe "data:audio/webm;codecs=opus;base64,"
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ═══════════════════════════════════════
    //  Reconnaissance vocale (push-to-talk)
    // ═══════════════════════════════════════

    /** Démarre l'écoute vocale. Appeler une fois pour démarrer, re-appeler pour arrêter. */
    startListening() {
        if (this.isListening$.value) {
            this.stopRecognition();
            this.isListening$.next(false);
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.addEntry({
                originalText: '⚠ Navigateur incompatible',
                translatedText: 'Utilisez Chrome ou Edge, ou tapez le texte',
                sourceLang: this.myLanguage$.value,
                targetLang: this.myLanguage$.value === 'fr' ? 'id' : 'fr',
                fromUserId: this.userId!,
                timestamp: new Date(),
                isMine: true,
                isError: true
            });
            return;
        }

        const recognition = new SpeechRecognition();
        this.recognition = recognition;

        recognition.lang = this.LANG_CODES[this.myLanguage$.value];
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('[VoiceTranslation] 🎤 Écoute démarrée :', recognition.lang);
            this.isListening$.next(true);
        };

        recognition.onresult = (event: any) => {
            const last = event.results[event.results.length - 1];
            if (!last.isFinal) return;
            const text = last[0].transcript.trim();
            if (!text || this.conversationId === null) return;
            console.log(`[VoiceTranslation] 🎤 Reconnu: "${text}"`);
            this.emitTranslation(text);
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            console.error('[VoiceTranslation] Erreur reconnaissance:', event.error);
            if (event.error === 'not-allowed') {
                this.addEntry({
                    originalText: '⚠ Microphone bloqué',
                    translatedText: 'Autorisez le micro dans les paramètres du navigateur',
                    sourceLang: this.myLanguage$.value,
                    targetLang: this.myLanguage$.value === 'fr' ? 'id' : 'fr',
                    fromUserId: this.userId!,
                    timestamp: new Date(),
                    isMine: true,
                    isError: true
                });
                this.isListening$.next(false);
            }
        };

        recognition.onend = () => {
            // Redémarrer automatiquement si toujours en mode écoute
            if (this.isListening$.value && this.recognition === recognition) {
                setTimeout(() => {
                    if (this.isListening$.value && this.recognition === recognition) {
                        try { recognition.start(); } catch (_) { }
                    }
                }, 500);
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('[VoiceTranslation] Impossible de démarrer:', err);
            this.isListening$.next(false);
        }
    }

    private stopRecognition() {
        const r = this.recognition;
        this.recognition = null;
        if (r) {
            try { r.stop(); } catch (_) { }
        }
    }

    // ═══════════════════════════════════════
    //  Envoi commun (texte ou voix)
    // ═══════════════════════════════════════

    private emitTranslation(text: string) {
        const myLang = this.myLanguage$.value;
        const targetLang: SupportedLang = myLang === 'fr' ? 'id' : 'fr';

        console.log(`[VoiceTranslation] Envoi: convId=${this.conversationId}, "${text}", ${myLang}→${targetLang}`);

        this.addEntry({
            originalText: text,
            translatedText: '...',
            sourceLang: myLang,
            targetLang,
            fromUserId: this.userId!,
            timestamp: new Date(),
            isMine: true
        });

        this.socketService.emitVoiceTranscript({
            conversationId: this.conversationId!,
            text,
            sourceLang: myLang,
            targetLang
        });
    }

    // ═══════════════════════════════════════
    //  Text-to-Speech (lecture de la traduction)
    // ═══════════════════════════════════════

    private speak(text: string, lang: SupportedLang) {
        if (!this.ttsEnabled$.value) return;
        if (!('speechSynthesis' in window)) return;

        // Annuler toute lecture en cours
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.LANG_CODES[lang];
        utterance.rate = 0.95;
        utterance.volume = 0.8;

        window.speechSynthesis.speak(utterance);
    }

    // ═══════════════════════════════════════
    //  Réception des traductions
    // ═══════════════════════════════════════

    private listenToIncomingTranslations() {
        this.subs.push(
            this.socketService.onTranslatedText().subscribe((data) => {
                console.log('[VoiceTranslation] Reçu translatedText:', data);
                const isMine = String(data.fromUserId) === String(this.userId);

                if (isMine) {
                    const entries = [...this.transcriptions$.value];
                    const pending = [...entries].reverse()
                        .find((e: TranslationEntry) => e.isMine && e.translatedText === '...');
                    if (pending) {
                        pending.translatedText = data.translatedText;
                        this.transcriptions$.next(entries);
                        return;
                    }
                }

                // Message d'un autre participant → nouvelle entrée + TTS
                this.addEntry({
                    originalText: data.originalText,
                    translatedText: data.translatedText,
                    sourceLang: data.sourceLang,
                    targetLang: data.targetLang,
                    fromUserId: data.fromUserId,
                    timestamp: new Date(),
                    isMine
                });

                // Lire la traduction à voix haute si ce n'est pas mon message
                if (!isMine) {
                    this.speak(data.translatedText, data.targetLang);
                }
            }),
            this.socketService.onTranslationError().subscribe((data) => {
                console.error('[VoiceTranslation] Erreur serveur:', data.message);
                const entries = [...this.transcriptions$.value];
                const last = [...entries].reverse().find((e: TranslationEntry) => e.isMine && e.translatedText === '...');
                if (last) {
                    last.translatedText = '⚠ ' + (data.message || 'Traduction indisponible');
                    last.isError = true;
                    this.transcriptions$.next(entries);
                } else {
                    this.addEntry({
                        originalText: '⚠ Erreur',
                        translatedText: data.message || 'Traduction indisponible',
                        sourceLang: this.myLanguage$.value,
                        targetLang: this.myLanguage$.value === 'fr' ? 'id' : 'fr',
                        fromUserId: this.userId!,
                        timestamp: new Date(),
                        isMine: true,
                        isError: true
                    });
                }
            })
        );
    }

    private addEntry(entry: TranslationEntry) {
        const updated = [...this.transcriptions$.value, entry].slice(-this.MAX_ENTRIES);
        this.transcriptions$.next(updated);
    }

    ngOnDestroy() {
        this.stop();
        this.subs.forEach(s => s.unsubscribe());
    }
}
