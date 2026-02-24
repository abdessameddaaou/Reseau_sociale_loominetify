import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-post-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, PickerComponent, TranslateModule],
  templateUrl: './post-creator.component.html'
})


export class PostCreatorComponent {

  @Input() postForm!: FormGroup;
  @Input() imagePreview: string | null = null;
  @Input() formErrors: { [key: string]: string } = {};
  @Input() currentUser: { photo?: string } | null = null;
  @Output() fileSelected = new EventEmitter<Event>();
  @Output() submitPost = new EventEmitter<void>();
  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';

  showEmoji: boolean = false;
  showPrivacyMenu: boolean = false;

  onFileChange(event: Event) {
    this.fileSelected.emit(event);
  }

  removeImage() {
    this.imagePreview = null;
    this.postForm.get('image')?.setValue(null);
  }

  setVisibility(value: 'public' | 'private') {
    if (this.postForm.get('visibility')) {
      this.postForm.get('visibility')?.setValue(value);
    } else {
      console.warn("Visibility control missing");
    }
    this.showPrivacyMenu = false;
  }

  onSubmit() {
    this.submitPost.emit();
  }

  toggleEmoji(event?: Event) {
    event?.stopPropagation();
    this.showEmoji = !this.showEmoji;
    this.showPrivacyMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    if (!el.closest('#emoji-popover') && !el.closest('#post-emoji-btn')) {
      this.showEmoji = false;
    }
    if (!el.closest('.relative')) {
      // Very basic approximation.
      // Easiest is to close menu if clicking anywhere outside the specific toggle button.
      if (!el.closest('button') || !el.closest('button')?.innerText.includes('Public') && !el.closest('button')?.innerText.includes('Privé')) {
        this.showPrivacyMenu = false;
      }
    }
  }

  handleEmojiSelect(event: any) {
    const emoji = event.emoji.native;

    const textControl = this.postForm.get('text');
    const currentValue = textControl?.value || '';

    textControl?.setValue(currentValue + emoji);

    // pour fermer le picker après sélection
    this.showEmoji = false;
  }
}

