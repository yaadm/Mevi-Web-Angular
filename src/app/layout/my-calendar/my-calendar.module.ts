import { FooterPageModule, PageHeaderModule } from '../../shared';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyCalendarRoutingModule } from './my-calendar-routing.module';
import { MyCalendarComponent } from './my-calendar.component';
import { CalendarModule } from 'angular-calendar';

@NgModule({
  imports: [
    CommonModule,
    MyCalendarRoutingModule,
    FooterPageModule,
    PageHeaderModule,
    CalendarModule.forRoot()
  ],
  declarations: [MyCalendarComponent]
})
export class MyCalendarModule { }
