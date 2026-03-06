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

    isActive$       = new BehaviorSubject<boolean>(false);
    isSpeaking$     = new BehaviorSubject<boolean>(false);
    transcriptions$ = new BehaviorSubject<TranslationEntry[]>([]);
    myLanguage$     = new BehaviorSubject<SupportedLang>('fr');

    private recognition: any = null;
    private conversationId: number | null = null;
    private userId: number | null = null;
    private subs: Subscription[] = [];

    private readonly MAX_ENTRIES = 10;
    private readonly LANG_CODES: Record<SupportedLang, string> = {
        fr: 'fr-FR',
        id: 'id-ID'
    };

    constructor(private socketService: SocketService) {
        this.listenToIncomingTranslations();
    }

    // ═══════════════════════════════════════
    //  API publique
    // ═══════════════════════════════════════

    /** Démarre la reconnaissance et l'écoute des traductions reçues. */
    start(conversationId: number, userId: number, myLang: SupportedLang = 'fr') {
        if (this.isActive$.value) return;

        this.conversationId = conversationId;
        this.userId = userId;
        this.myLanguage$.next(myLang);
        this.isActive$.next(true);
        this.transcriptions$.next([]);

        this.startRecognition();
    }

    /** Arrête tout. */
    stop() {
        this.isActive$.next(false);
        this.isSpeaking$.next(false);
        this.stopRecognition();
    }

    /** Bascule la langue de l'utilisateur (FR ↔ ID) et redémarre la reconnaissance. */
    toggleLanguage() {
        const next: SupportedLang = this.myLanguage$.value === 'fr' ? 'id' : 'fr';
        this.myLanguage$.next(next);
        if (this.isActive$.value) {
            this.stopRecognition();
            setTimeout(() => this.startRecognition(), 300);
        }
    }

    // ═══════════════════════════════════════
    //  Reconnaissance vocale (Web Speech API)
    // ═══════════════════════════════════════

    private startRecognition() {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('[VoiceTranslation] Web Speech API non supportée par ce navigateur');
            return;
        }

        // Variable locale pour éviter les closures périmées en cas de restart
        const recognition = new SpeechRecognition();
        this.recognition = recognition;

        recognition.lang = this.LANG_CODES[this.myLanguage$.value];
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('[VoiceTranslation] Démarré :', recognition.lang);
        };

        recognition.onspeechstart = () => this.isSpeaking$.next(true);
        recognition.onspeechend   = () => this.isSpeaking$.next(false);

        recognition.onresult = (event: any) => {
            const last = event.results[event.results.length - 1];
            if (!last.isFinal) return;

            const text = last[0].transcript.trim();
            if (!text || this.conversationId === null) return;

            const myLang   = this.myLanguage$.value;
            const targetLang: SupportedLang = myLang === 'fr' ? 'id' : 'fr';

            this.addEntry({
                originalText:   text,
                translatedText: '...',
                sourceLang:     myLang,
                targetLang,
                fromUserId:     this.userId!,
                timestamp:      new Date(),
                isMine:         true
            });

            this.socketService.emitVoiceTranscript({
                conversationId: this.conversationId!,
                text,
                sourceLang: myLang,
                targetLang
            });
        };

        recognition.onerror = (event: any) => {
            // 'no-speech' et 'aborted' sont non critiques :
            // - no-speech : silence détecté, normal
            // - aborted   : on a appelé stop() nous-mêmes, normal
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            console.error('[VoiceTranslation] Erreur:', event.error);
            this.isSpeaking$.next(false);
        };

        recognition.onend = () => {
            this.isSpeaking$.next(false);
            // Ne redémarrer que si cette instance est toujours l'instance active
            // (évite le restart après un stopRecognition() délibéré)
            if (this.isActive$.value && this.recognition === recognition) {
                setTimeout(() => {
                    if (this.isActive$.value && this.recognition === recognition) {
                        this.startRecognition();
                    }
                }, 300);
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('[VoiceTranslation] Impossible de démarrer:', err);
        }
    }

    private stopRecognition() {
        const r = this.recognition;
        this.recognition = null; // Nullifier AVANT stop() pour bloquer le restart dans onend
        if (r) {
            try { r.stop(); } catch (_) {}
        }
    }

    // ═══════════════════════════════════════
    //  Réception des traductions (autres participants)
    // ═══════════════════════════════════════

    private listenToIncomingTranslations() {
        this.subs.push(
            this.socketService.onTranslatedText().subscribe((data) => {
                this.addEntry({
                    originalText:   data.originalText,
                    translatedText: data.translatedText,
                    sourceLang:     data.sourceLang,
                    targetLang:     data.targetLang,
                    fromUserId:     data.fromUserId,
                    timestamp:      new Date(),
                    isMine:         false
                });
            }),
            this.socketService.onTranslationError().subscribe((data) => {
                console.error('[VoiceTranslation] Erreur serveur:', data.message);
                // Mettre à jour le dernier "..." en message d'erreur
                const entries = [...this.transcriptions$.value];
                const last = [...entries].reverse().find((e: TranslationEntry) => e.isMine && e.translatedText === '...');
                if (last) {
                    last.translatedText = '⚠ Traduction indisponible';
                    last.isError = true;
                    this.transcriptions$.next(entries);
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
