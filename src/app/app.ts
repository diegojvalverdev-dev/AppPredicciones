import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule],
  template: `<router-outlet></router-outlet>`
})
export class App {
  protected readonly title = signal('AppPredicciones');
}
