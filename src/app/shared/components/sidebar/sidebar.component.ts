import { Component, isDevMode, OnInit, OnDestroy  } from '@angular/core';
import { DatabaseService, AuthListener } from '../../services';
import { DataSnapshot } from 'firebase/database';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy, AuthListener {
  isActive = false;
    showMenu = '';
    isDevMode: boolean;
    currentUser: DataSnapshot;
    constructor(private database: DatabaseService) {
      this.isDevMode = isDevMode();
    }
    ngOnInit(): void {
      this.database.subscribeToAuth(this);
    }
    ngOnDestroy(): void {
      this.database.unsubscribeFromAuth(this);
    }
    onUserChanged(user: any) {
      this.currentUser = user;
    }
    eventCalled() {
        this.isActive = !this.isActive;
    }
    addExpandClass(element: any) {
        if (element === this.showMenu) {
            this.showMenu = '0';
        } else {
            this.showMenu = element;
        }
    }
}
