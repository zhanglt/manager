import { NgModule } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { FrameComponent } from './frame.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { NavsearchComponent } from './header/navsearch/navsearch.component';
import { FooterComponent } from './footer/footer.component';

import { NvCommonModule } from '../common/nvCommon.module';
import { GlobalNotificationsModule } from '@components/global-notifications/global-notifications.module';

@NgModule({
  imports: [NvCommonModule, MatDividerModule, GlobalNotificationsModule],
  providers: [],
  declarations: [
    FrameComponent,
    SidebarComponent,
    HeaderComponent,
    NavsearchComponent,
    FooterComponent,
  ],
  exports: [
    FrameComponent,
    SidebarComponent,
    HeaderComponent,
    NavsearchComponent,
    FooterComponent,
  ],
})
export class FrameModule {}