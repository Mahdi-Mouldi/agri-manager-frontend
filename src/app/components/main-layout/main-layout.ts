import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { HeaderComponent } from '../header/header';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, HeaderComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {

}
