import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


@Component({
  selector: 'app-post-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, PickerComponent],
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
  onFileChange(event: Event) {
    this.fileSelected.emit(event);
  }

  onSubmit() {
    this.submitPost.emit();
  }

  toggleEmoji() {
  this.showEmoji = !this.showEmoji;
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

