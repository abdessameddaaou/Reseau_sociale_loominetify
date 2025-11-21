import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input() activeTab: 'home' | 'notifications' | 'messages' | 'profile' | 'settings' = 'home';
  @Output() tabChange = new EventEmitter<typeof this.activeTab>();

  onTabClick(tab: typeof this.activeTab) {
    this.tabChange.emit(tab);
  }
}
