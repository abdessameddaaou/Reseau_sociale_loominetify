import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-post-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './post-creator.component.html'
})
export class PostCreatorComponent {
  @Input() postForm!: FormGroup;
  @Input() imagePreview: string | null = null;
  @Input() formErrors: { [key: string]: string } = {};

  @Output() fileSelected = new EventEmitter<Event>();
  @Output() submitPost = new EventEmitter<void>();

  onFileChange(event: Event) {
    this.fileSelected.emit(event);
  }

  onSubmit() {
    this.submitPost.emit();
  }
}
