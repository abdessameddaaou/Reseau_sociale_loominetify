import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voice-player" [class.voice-player--me]="isMe">
      <!-- Play/Pause -->
      <button (click)="togglePlay()" type="button" class="voice-player-btn" [class.voice-player-btn--me]="isMe">
        <svg *ngIf="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" style="margin-left: 2px;">
          <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
        </svg>
        <svg *ngIf="isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Progress & Waveform -->
      <div class="voice-player-body">
        <!-- Waveform bars -->
        <div class="voice-player-waveform" #progressContainer (click)="seek($event)">
          <div class="voice-bar" *ngFor="let bar of waveformBars; let i = index"
            [style.height.px]="bar"
            [class.voice-bar--played]="isBarPlayed(i)"
            [class.voice-bar--me]="isMe">
          </div>
        </div>

        <!-- Time + Speed -->
        <div class="voice-player-footer">
          <span class="voice-player-time-text">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <button (click)="cycleSpeed()" type="button" class="voice-player-speed" [class.voice-player-speed--me]="isMe">
            x{{ playbackRate }}
          </button>
        </div>
      </div>

      <audio #audioElement [src]="audioUrl" preload="auto"
        (timeupdate)="onTimeUpdate()" (loadedmetadata)="onLoadedMetadata()"
        (durationchange)="onDurationChange()" (ended)="onEnded()" (canplay)="onCanPlay()"></audio>
    </div>
  `,
  styles: [`
    .voice-player {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-width: 220px;
      max-width: 300px;
      user-select: none;
    }

    .voice-player-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(0, 0, 0, 0.08);
      color: var(--accent-main, #6366f1);
    }

    .voice-player-btn:hover {
      transform: scale(1.08);
    }

    .voice-player-btn--me {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    .voice-player-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .voice-player-waveform {
      display: flex;
      align-items: center;
      gap: 2px;
      height: 30px;
      cursor: pointer;
      padding: 2px 0;
      position: relative;
    }

    .voice-bar {
      flex: 1;
      min-width: 3px;
      max-width: 4px;
      border-radius: 2px;
      background: rgba(0, 0, 0, 0.15);
      transition: background 0.1s ease;
      pointer-events: none;
    }

    .voice-bar--played {
      background: var(--accent-main, #6366f1) !important;
    }

    .voice-bar--me {
      background: rgba(255, 255, 255, 0.3);
    }

    .voice-bar--me.voice-bar--played {
      background: #ffffff !important;
    }

    .voice-player-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2px;
    }

    .voice-player-time-text {
      font-size: 10px;
      font-weight: 500;
      opacity: 0.65;
    }

    .voice-player-speed {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      background: rgba(0, 0, 0, 0.08);
      color: var(--accent-main, #6366f1);
      transition: all 0.15s ease;
      line-height: 1.4;
    }

    .voice-player-speed:hover {
      background: rgba(0, 0, 0, 0.14);
      transform: scale(1.05);
    }

    .voice-player-speed--me {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .voice-player-speed--me:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  `]
})
export class AudioPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() audioUrl!: string;
  @Input() isMe: boolean = false;

  // Legacy input
  @Input() themeClass: string = '';

  @ViewChild('audioElement', { static: false }) audioEl!: ElementRef<HTMLAudioElement>;
  @ViewChild('progressContainer', { static: false }) progressContainer!: ElementRef<HTMLDivElement>;

  isPlaying = false;
  currentTime = 0;
  duration = 0;
  progressPercentage = 0;
  playbackRate: number = 1;

  private readonly speeds = [1, 1.5, 2];

  // Generate random waveform bar heights for visual effect
  waveformBars: number[] = [];

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    // Generate 30 random bar heights between 6 and 26
    this.waveformBars = Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 6);
  }

  ngAfterViewInit() {
    const audio = this.audioEl?.nativeElement;
    if (audio) {
      // Force preload
      audio.load();
    }
  }

  togglePlay() {
    const audio = this.audioEl.nativeElement;
    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
    } else {
      audio.playbackRate = this.playbackRate;
      audio.play().then(() => {
        this.isPlaying = true;
        this.cdr.detectChanges();
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  }

  onTimeUpdate() {
    const audio = this.audioEl.nativeElement;
    this.currentTime = audio.currentTime;
    if (this.duration > 0) {
      this.progressPercentage = (this.currentTime / this.duration) * 100;
    }
    // Force change detection since this is triggered by native event
    this.cdr.detectChanges();
  }

  onLoadedMetadata() {
    const audio = this.audioEl.nativeElement;
    if (audio.duration && isFinite(audio.duration)) {
      this.duration = audio.duration;
      this.cdr.detectChanges();
    }
  }

  onDurationChange() {
    const audio = this.audioEl.nativeElement;
    if (audio.duration && isFinite(audio.duration)) {
      this.duration = audio.duration;
      this.cdr.detectChanges();
    }
  }

  onCanPlay() {
    const audio = this.audioEl.nativeElement;
    if (audio.duration && isFinite(audio.duration) && this.duration === 0) {
      this.duration = audio.duration;
      this.cdr.detectChanges();
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.progressPercentage = 0;
    this.cdr.detectChanges();
  }

  isBarPlayed(index: number): boolean {
    if (this.duration <= 0) return false;
    const barPosition = (index / this.waveformBars.length) * 100;
    return barPosition <= this.progressPercentage;
  }

  seek(event: MouseEvent) {
    event.stopPropagation();
    const audio = this.audioEl.nativeElement;
    const container = this.progressContainer.nativeElement;

    if (!this.duration || this.duration <= 0 || !isFinite(this.duration)) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    const newTime = percentage * this.duration;
    audio.currentTime = newTime;
    this.currentTime = newTime;
    this.progressPercentage = percentage * 100;
    this.cdr.detectChanges();
  }

  cycleSpeed() {
    const currentIdx = this.speeds.indexOf(this.playbackRate);
    const nextIdx = (currentIdx + 1) % this.speeds.length;
    this.playbackRate = this.speeds[nextIdx];

    const audio = this.audioEl.nativeElement;
    audio.playbackRate = this.playbackRate;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  ngOnDestroy() {
    const audio = this.audioEl?.nativeElement;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
  }
}
