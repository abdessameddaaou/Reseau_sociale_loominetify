import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CallService, CallState, CallInfo, RemoteStream } from '../../service/call.service';
import { VoiceTranslationService, TranslationEntry, SupportedLang } from '../../service/voice-translation.service';
import { SrcObjectDirective } from '../../directives/src-object.directive';

@Component({
  selector: 'app-call-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, SrcObjectDirective],
  template: `
    <!-- Overlay backdrop -->
    <div class="call-overlay" *ngIf="callState !== 'idle'" [class.call-overlay--video]="callInfo?.callType === 'video' && callState === 'active'">

      <!-- ═══ RINGING / CALLING ═══ -->
      <div class="call-ringing" *ngIf="callState === 'calling' || callState === 'ringing'">
        <div class="call-ringing-pulse">
          <div class="call-ringing-avatar">
            <img *ngIf="getDisplayPhoto()" [src]="getDisplayPhoto()" alt="Avatar" class="call-ringing-avatar-img" />
            <div *ngIf="!getDisplayPhoto()" class="call-ringing-avatar-placeholder">
              {{ getInitials() }}
            </div>
          </div>
        </div>

        <h2 class="call-ringing-name">
          {{ getDisplayName() }}
        </h2>
        <p class="call-ringing-status">
          {{ callState === 'calling' ? 'Appel en cours...' : (callInfo?.callType === 'video' ? 'Appel vidéo entrant...' : 'Appel audio entrant...') }}
        </p>
        <p class="call-ringing-type">
          <svg *ngIf="callInfo?.callType === 'video'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75A2.25 2.25 0 0016.5 16.5v-9A2.25 2.25 0 0014.25 5.25H4.5A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
          </svg>
          <svg *ngIf="callInfo?.callType === 'audio'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </p>

        <!-- Ringing Controls -->
        <div class="call-ringing-actions">
          <button *ngIf="callState === 'ringing'" (click)="onAccept()" class="call-action-btn call-action-btn--accept" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </button>
          <button (click)="onDeclineOrEnd()" class="call-action-btn call-action-btn--decline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6" style="transform: rotate(135deg);">
              <path fill-rule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- ═══ ACTIVE CALL ═══ -->
      <div class="call-active" *ngIf="callState === 'active'">

        <!-- Video Grid -->
        <div class="call-video-grid" *ngIf="callInfo?.callType === 'video'">
          <!-- Remote videos -->
          <div class="call-video-cell" *ngFor="let rs of remoteStreams; trackBy: trackByUserId">
            <video [appSrcObject]="rs.stream" autoplay playsinline class="call-video-element" [muted]="isRemoteMuted"></video>
          </div>
          <!-- Local video (small PIP) -->
          <div class="call-video-local" *ngIf="localStream">
            <video [appSrcObject]="localStream" autoplay playsinline muted class="call-video-element call-video-element--local"></video>
          </div>
        </div>

        <!-- Audio-only view -->
        <div class="call-audio-view" *ngIf="callInfo?.callType === 'audio'">
          <div class="call-audio-avatar call-ringing-pulse">
            <div class="call-ringing-avatar">
              <img *ngIf="getDisplayPhoto()" [src]="getDisplayPhoto()" alt="Avatar" class="call-ringing-avatar-img" />
              <div *ngIf="!getDisplayPhoto()" class="call-ringing-avatar-placeholder">
                {{ getInitials() }}
              </div>
            </div>
          </div>
          <h2 class="call-audio-name">{{ getDisplayName() }}</h2>

          <!-- Hidden audio elements to actually play the remote stream sound -->
          <audio *ngFor="let rs of remoteStreams; trackBy: trackByUserId" [appSrcObject]="rs.stream" autoplay [muted]="isRemoteMuted"></audio>
        </div>

        <!-- Duration -->
        <div class="call-timer">{{ formatDuration(callDuration) }}</div>

        <!-- ═══ Panneau de traduction ═══ -->
        <div class="call-translation-panel" *ngIf="isTranslationActive">

          <!-- En-tête : langue -->
          <div class="call-translation-header">
            <button class="call-translation-lang-btn" (click)="onToggleTranslationLang()" type="button"
              title="Changer ma langue">
              <span>{{ getLangName(myLanguage) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:12px;height:12px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span>{{ getLangName(myLanguage === 'fr' ? 'id' : 'fr') }}</span>
            </button>
          </div>

          <!-- Liste des transcriptions -->
          <div class="call-translation-entries" #translationScroll *ngIf="transcriptions.length > 0">
            <div class="call-translation-entry"
              *ngFor="let entry of transcriptions"
              [class.call-translation-entry--mine]="entry.isMine">
              <div class="call-translation-original">
                <span class="call-translation-lang-tag">{{ getLangName(entry.sourceLang) }}</span>
                {{ entry.originalText }}
              </div>
              <div class="call-translation-translated" *ngIf="entry.translatedText !== '...'">
                <span class="call-translation-lang-tag call-translation-lang-tag--target">{{ getLangName(entry.targetLang) }}</span>
                {{ entry.translatedText }}
              </div>
              <div class="call-translation-loading" *ngIf="entry.translatedText === '...'">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <div class="call-translation-empty" *ngIf="transcriptions.length === 0">
            Tapez un message pour le traduire
          </div>

          <!-- Champ de saisie -->
          <div class="call-translation-input-bar">
            <input type="text"
              class="call-translation-input"
              [(ngModel)]="translationInput"
              (keydown.enter)="onSendTranslation()"
              [placeholder]="'🎤 Traduction audio en cours... ou taper (' + getLangName(myLanguage) + ')'"
              autocomplete="off" />
            <button class="call-translation-send-btn" (click)="onSendTranslation()" type="button"
              [disabled]="!translationInput?.trim()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
            <button class="call-translation-tts-btn" (click)="onToggleTts()" type="button"
              [class.call-translation-tts-btn--active]="ttsEnabled"
              [title]="ttsEnabled ? 'Désactiver la lecture vocale' : 'Activer la lecture vocale'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Controls Bar -->
        <div class="call-controls">
          <button (click)="onToggleMute()" class="call-control-btn" [class.call-control-btn--active]="isMuted" type="button" title="Micro">
            <svg *ngIf="!isMuted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            <svg *ngIf="isMuted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.57 16.476c-.223.082-.448.161-.674.238L7.319 4.137A3.75 3.75 0 0115.75 4.5v6.75c0 .18-.013.357-.037.53l4.857 4.696zM12 18.75a5.98 5.98 0 01-3.159-.9L5.03 14.04A5.978 5.978 0 006 12.75v-1.5a.75.75 0 00-1.5 0v1.5a7.478 7.478 0 001.564 4.588l-2.03 2.03A.75.75 0 105.094 20.43l1.985-1.985A7.477 7.477 0 0011.25 20.2v2.3H8.25a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-3v-2.3a7.477 7.477 0 004.17-1.754l1.986 1.985a.75.75 0 101.06-1.06l-2.03-2.03A7.44 7.44 0 0019.5 12.75v-1.5a.75.75 0 00-1.5 0v1.5a5.978 5.978 0 01-.97 3.274l-3.862-3.862A3.726 3.726 0 0015.75 11.25V4.5a3.75 3.75 0 00-7.5 0v.847l3.614 3.614A3.75 3.75 0 0012 15.75c.336 0 .66-.044.967-.127L12 18.75z" />
            </svg>
          </button>

          <button *ngIf="callInfo?.callType === 'video'" (click)="onToggleVideo()" class="call-control-btn" [class.call-control-btn--active]="isVideoOff" type="button" title="Caméra">
            <svg *ngIf="!isVideoOff" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75A2.25 2.25 0 0016.5 16.5v-9A2.25 2.25 0 0014.25 5.25H4.5A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
            <svg *ngIf="isVideoOff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a.75.75 0 01-.282.53l-4.72 4.72V13.06l3.249-3.249a.75.75 0 011.28.53v.265l.473 1.947zM2.25 7.5A2.25 2.25 0 014.5 5.25h9.75a2.25 2.25 0 012.25 2.25v2.56l-6-6H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25h.19l-2.19-2.19V7.5z" />
            </svg>
          </button>

          <!-- Bouton traduction -->
          <button (click)="onToggleTranslation()" class="call-control-btn"
            [class.call-control-btn--translation-active]="isTranslationActive"
            type="button" title="Traduction FR ↔ ID">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
          </button>

          <button (click)="onDeclineOrEnd()" class="call-control-btn call-control-btn--end" type="button" title="Raccrocher">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6" style="transform: rotate(135deg);">
              <path fill-rule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .call-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 10, 30, 0.92);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: callFadeIn 0.3s ease;
    }

    .call-overlay--video {
      background: #000;
    }

    @keyframes callFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ── Ringing ── */
    .call-ringing {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .call-ringing-pulse {
      position: relative;
    }

    .call-ringing-pulse::before,
    .call-ringing-pulse::after {
      content: '';
      position: absolute;
      inset: -16px;
      border-radius: 50%;
      border: 2px solid rgba(99, 102, 241, 0.4);
      animation: callPulse 2s ease-out infinite;
    }

    .call-ringing-pulse::after {
      animation-delay: 1s;
    }

    @keyframes callPulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .call-ringing-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid rgba(255,255,255,0.2);
      position: relative;
      z-index: 1;
    }

    .call-ringing-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .call-ringing-avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #6366f1, #a855f7);
    }

    .call-ringing-name {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      margin: 8px 0 0;
    }

    .call-ringing-status {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      animation: callStatusBlink 1.5s ease infinite;
    }

    @keyframes callStatusBlink {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    .call-ringing-type {
      color: rgba(255,255,255,0.5);
    }

    .call-ringing-type svg {
      width: 28px;
      height: 28px;
    }

    .call-ringing-actions {
      display: flex;
      gap: 32px;
      margin-top: 32px;
    }

    .call-action-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: #fff;
    }

    .call-action-btn:hover {
      transform: scale(1.1);
    }

    .call-action-btn--accept {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
      animation: callBtnPulse 1.5s ease-in-out infinite;
    }

    @keyframes callBtnPulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4); }
      50% { box-shadow: 0 4px 30px rgba(34, 197, 94, 0.7); }
    }

    .call-action-btn--decline {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
    }

    /* ── Active Call ── */
    .call-active {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .call-video-grid {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      position: relative;
    }

    .call-video-cell {
      width: 100%;
      height: 100%;
      background: #111;
      position: relative;
      overflow: hidden;
    }

    .call-video-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .call-video-local {
      position: absolute;
      bottom: 100px;
      right: 24px;
      width: 180px;
      height: 240px;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 10;
    }

    .call-video-element--local {
      transform: scaleX(-1);
    }

    /* Audio view */
    .call-audio-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .call-audio-avatar {
      position: relative;
    }

    .call-audio-name {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }

    /* Timer */
    .call-timer {
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 16px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
      background: rgba(0,0,0,0.4);
      padding: 6px 20px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      z-index: 20;
    }

    /* Controls */
    .call-controls {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      padding: 16px 32px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.1);
      z-index: 20;
    }

    .call-control-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.15);
      color: #fff;
      transition: all 0.2s ease;
    }

    .call-control-btn:hover {
      background: rgba(255,255,255,0.25);
      transform: scale(1.08);
    }

    .call-control-btn--active {
      background: rgba(255,255,255,0.9);
      color: #111;
    }

    .call-control-btn--end {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
    }

    .call-control-btn--end:hover {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }

    .call-control-btn--translation-active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
    }

    /* ── Panneau de traduction ── */
    .call-translation-panel {
      position: absolute;
      bottom: 110px;
      left: 50%;
      transform: translateX(-50%);
      width: min(420px, 90vw);
      background: rgba(10, 10, 30, 0.85);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 16px;
      padding: 12px;
      z-index: 25;
      animation: callFadeIn 0.25s ease;
    }

    .call-translation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .call-translation-lang-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      border-radius: 20px;
      padding: 4px 12px;
      color: #a5b4fc;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      letter-spacing: 0.05em;
    }

    .call-translation-lang-btn:hover {
      background: rgba(99, 102, 241, 0.35);
    }

    .call-translation-speaking {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #4ade80;
      font-weight: 600;
    }

    .call-translation-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      animation: callStatusBlink 0.8s ease infinite;
    }

    .call-translation-entries {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .call-translation-entry {
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      border-left: 3px solid rgba(255, 255, 255, 0.2);
    }

    .call-translation-entry--mine {
      border-left-color: #6366f1;
      background: rgba(99, 102, 241, 0.08);
    }

    .call-translation-original {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.75);
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 4px;
    }

    .call-translation-translated {
      font-size: 14px;
      color: #fff;
      font-weight: 600;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .call-translation-lang-tag {
      font-size: 10px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.12);
      padding: 1px 5px;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.6);
      flex-shrink: 0;
      letter-spacing: 0.05em;
    }

    .call-translation-lang-tag--target {
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
    }

    .call-translation-loading {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }

    .call-translation-loading span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      animation: translationDots 1.2s ease-in-out infinite;
    }

    .call-translation-loading span:nth-child(2) { animation-delay: 0.2s; }
    .call-translation-loading span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes translationDots {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
      40%            { transform: scale(1.2); opacity: 1; }
    }

    /* ── Input traduction ── */
    .call-translation-input-bar {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      align-items: center;
    }

    .call-translation-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
    }

    .call-translation-input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .call-translation-input:focus {
      border-color: rgba(99, 102, 241, 0.6);
      background: rgba(255, 255, 255, 0.12);
    }

    .call-translation-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      transition: opacity 0.2s, transform 0.2s;
      flex-shrink: 0;
    }

    .call-translation-send-btn:hover:not(:disabled) {
      transform: scale(1.08);
    }

    .call-translation-send-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }


    .call-translation-tts-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.4);
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .call-translation-tts-btn--active {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
    }

    .call-translation-tts-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .call-translation-empty {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
      text-align: center;
      padding: 8px 0;
    }
  `]
})
export class CallOverlayComponent implements OnInit, OnDestroy {
  callState: CallState = 'idle';
  callInfo: CallInfo | null = null;
  localStream: MediaStream | null = null;
  remoteStreams: RemoteStream[] = [];
  callDuration = 0;
  isMuted = false;
  isVideoOff = false;

  // Traduction
  isTranslationActive = false;
  isRemoteMuted = false;
  transcriptions: TranslationEntry[] = [];
  myLanguage: SupportedLang = 'fr';
  translationInput = '';
  ttsEnabled = true;

  @ViewChild('translationScroll') translationScroll?: ElementRef;
  private subs: Subscription[] = [];

  // Ringtone Web Audio API properties
  private ringCtx?: AudioContext;
  private ringOsc?: OscillatorNode;
  private ringGain?: GainNode;
  private ringInterval?: any;

  constructor(
    private callService: CallService,
    private voiceTranslation: VoiceTranslationService
  ) { }

  ngOnInit() {
    this.subs.push(
      this.callService.callState$.subscribe(s => {
        this.callState = s;
        if (s === 'calling' || s === 'ringing') {
          this.playRingtone();
        } else {
          this.stopRingtone();
        }
        // Arrêter la traduction quand l'appel se termine
        if (s === 'idle' || s === 'ended') {
          this.stopTranslation();
        }
      }),
      this.callService.callInfo$.subscribe(i => this.callInfo = i),
      this.callService.localStream$.subscribe(s => this.localStream = s),
      this.callService.remoteStreams$.subscribe(s => this.remoteStreams = s),
      this.callService.callDuration$.subscribe(d => this.callDuration = d),
      this.callService.isMuted$.subscribe(m => this.isMuted = m),
      this.callService.isVideoOff$.subscribe(v => this.isVideoOff = v),
      // Traduction
      this.voiceTranslation.isActive$.subscribe(a => this.isTranslationActive = a),
      this.voiceTranslation.transcriptions$.subscribe(t => this.transcriptions = t),
      this.voiceTranslation.myLanguage$.subscribe(l => this.myLanguage = l),
      this.voiceTranslation.ttsEnabled$.subscribe(t => this.ttsEnabled = t),
    );
  }

  getInitials(): string {
    const name = this.getDisplayName();
    return name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
  }

  getDisplayName(): string {
    if (this.callInfo?.conversationName) return this.callInfo.conversationName;
    // If I am the caller, I want to see the receiver's name (which would technically be the conversation name in 1-to-1)
    // If I am the receiver, I want to see the caller's name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.callInfo?.callerId === user.id) {
      return this.callInfo?.conversationName || 'Appel en cours...';
    }
    return this.callInfo?.callerInfo?.name || 'Inconnu';
  }

  getDisplayPhoto(): string {
    if (this.callInfo?.conversationAvatar) return this.callInfo.conversationAvatar;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // If I am the caller, the overlay shouldn't just show my own photo. 
    // In a direct chat, conversationAvatar is usually the receiver's photo.
    // If we are the receiver (callerId !== my id), show the caller's photo.
    if (this.callInfo?.callerId !== user.id) {
      return this.callInfo?.callerInfo?.photo || '';
    }
    return '';
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  onAccept() {
    // Get current user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.callService.acceptCall({
      id: user.id,
      name: `${user.prenom || ''} ${user.nom || ''}`.trim(),
      photo: user.photo || null
    });
  }

  onDeclineOrEnd() {
    if (this.callState === 'ringing') {
      this.callService.declineCall();
    } else {
      this.callService.endCall();
    }
  }

  onToggleMute() {
    this.callService.toggleMute();
  }

  onToggleVideo() {
    this.callService.toggleVideo();
  }

  // ═══════════════════════════════════════
  //  Traduction vocale
  // ═══════════════════════════════════════

  trackByUserId(_: number, rs: RemoteStream): number {
    return rs.userId;
  }

  getLangName(lang: SupportedLang): string {
    return lang === 'fr' ? 'Français' : 'Indonésien';
  }

  onToggleTranslation() {
    if (this.isTranslationActive) {
      this.stopTranslation();
    } else {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const info = this.callInfo;
      if (!info) return;
      this.voiceTranslation.start(info.conversationId, user.id, 'fr');
      // Démarrer l'écoute continue via Web Speech API (fiable, natif)
      this.voiceTranslation.startListening();
      // Couper le son original — remplacé par la lecture TTS de la traduction
      this.setRemoteAudioMuted(true);
    }
  }

  onToggleTranslationLang() {
    this.voiceTranslation.toggleLanguage();
  }

  onSendTranslation() {
    const text = this.translationInput?.trim();
    if (!text) return;
    this.voiceTranslation.sendText(text);
    this.translationInput = '';
    this.scrollToBottom();
  }

  onToggleTts() {
    this.voiceTranslation.toggleTts();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.translationScroll) {
        this.translationScroll.nativeElement.scrollTop = this.translationScroll.nativeElement.scrollHeight;
      }
    }, 50);
  }

  private stopTranslation() {
    if (this.isTranslationActive) {
      this.voiceTranslation.stop();
      this.setRemoteAudioMuted(false);
    }
  }

  private setRemoteAudioMuted(muted: boolean) {
    this.isRemoteMuted = muted;
  }

  // ═══════════════════════════════════════
  //  Ringtone Synthesizer (Web Audio API)
  // ═══════════════════════════════════════
  private async playRingtone() {
    if (this.ringCtx) return; // Already playing
    try {
      this.ringCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Resume for Chrome autoplay policy — works immediately if user already interacted with page
      await this.ringCtx.resume();

      // Dual tone for European/UK/Standard ringing (400Hz + 450Hz or 440+480)
      const osc1 = this.ringCtx.createOscillator();
      const osc2 = this.ringCtx.createOscillator();
      this.ringGain = this.ringCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      osc1.connect(this.ringGain);
      osc2.connect(this.ringGain);
      this.ringGain.connect(this.ringCtx.destination);

      this.ringGain.gain.value = 0;
      osc1.start();
      osc2.start();

      this.ringOsc = osc1;
      const osc2Ref = osc2;

      const pulse = () => {
        if (!this.ringCtx || !this.ringGain) return;
        const now = this.ringCtx.currentTime;
        // Ring for 1.2s, wait 1.8s
        this.ringGain.gain.setValueAtTime(0, now);
        this.ringGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        this.ringGain.gain.setValueAtTime(0.3, now + 1.2);
        this.ringGain.gain.linearRampToValueAtTime(0, now + 1.25);
      };

      pulse();
      this.ringInterval = setInterval(pulse, 3000);

      (this as any)._ringOsc2 = osc2Ref;
    } catch (e) {
      console.warn('Web Audio API not supported for ringtone', e);
    }
  }

  private stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.ringOsc) {
      try { this.ringOsc.stop(); } catch (e) { }
      this.ringOsc = undefined;
    }
    if ((this as any)._ringOsc2) {
      try { (this as any)._ringOsc2.stop(); } catch (e) { }
      (this as any)._ringOsc2 = undefined;
    }
    if (this.ringCtx) {
      this.ringCtx.close().catch(() => { }).finally(() => {
        this.ringCtx = undefined;
        this.ringGain = undefined;
      });
    }
  }

  ngOnDestroy() {
    this.stopRingtone();
    this.stopTranslation();
    this.subs.forEach(s => s.unsubscribe());
  }
}
