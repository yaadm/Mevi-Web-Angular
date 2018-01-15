import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
    {
        path: '', component: LayoutComponent,
        children: [
            { path: 'home-page', loadChildren: './home/home.module#HomeModule' },
            { path: 'create-order-page', loadChildren: './create-order/create-order.module#CreateOrderModule' },
            { path: 'order-details/:orderId', loadChildren: './order-details/order-details.module#OrderDetailsModule' },
            { path: 'my-new-orders-page', loadChildren: './my-new-orders/my-new-orders.module#MyNewOrdersModule' },
            { path: 'my-pending-orders-page', loadChildren: './my-pending-orders/my-pending-orders.module#MyPendingOrdersModule' },
            { path: 'my-completed-orders-page', loadChildren: './my-completed-orders/my-completed-orders.module#MyCompletedOrdersModule' },
            { path: 'open-orders-page/:from/:to/:start/:end', loadChildren: './open-orders/open-orders.module#OpenOrdersModule' },
            { path: 'open-orders-page', loadChildren: './open-orders/open-orders.module#OpenOrdersModule' },
            { path: 'my-pending-deliveries-page', loadChildren: './my-pending-deliveries/my-pending-deliveries.module#MyPendingDeliveriesModule' },
            { path: 'my-completed-deliveries-page', loadChildren: './my-completed-deliveries/my-completed-deliveries.module#MyCompletedDeliveriesModule' },
            { path: 'managers-registration-requests-page', loadChildren: './managers-registration-requests/managers-registration-requests.module#ManagersRegistrationRequestsModule' },
            { path: 'manage-users-page', loadChildren: './manage-users/manage-users.module#ManageUsersModule' },
            { path: 'about-us-page', loadChildren: './about-us-page/about-us-page.module#AboutUsPageModule' },
            { path: 'contact-us-page', loadChildren: './contact-us-page/contact-us-page.module#ContactUsPageModule' },
            { path: 'payment/:userId', loadChildren: './payment/payment.module#PaymentModule' },
            { path: 'registration-page', loadChildren: './registration/registration.module#RegistrationModule' },
            { path: 'manager-registration-page', loadChildren: './manager-registration/manager-registration.module#ManagerRegistrationModule' },
            { path: 'tos-page', loadChildren: './tos-page/tos-page.module#TosPageModule' },
            { path: 'pp-page', loadChildren: './pp-page/pp-page.module#PpPageModule' },
            { path: 'user-profile/:userId', loadChildren: './user-profile/user-profile.module#UserProfileModule' },
            { path: 'my-profile', loadChildren: './my-profile/my-profile.module#MyProfileModule' },
            { path: 'user-unsubscribed', loadChildren: './user-unsubscribed/user-unsubscribed.module#UserUnsubscribedModule' },
            { path: 'my-calendar', loadChildren: './my-calendar/my-calendar.module#MyCalendarModule' },

            { path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardModule' },
            { path: 'charts', loadChildren: './charts/charts.module#ChartsModule' },
            { path: 'tables', loadChildren: './tables/tables.module#TablesModule' },
            { path: 'forms', loadChildren: './form/form.module#FormModule' },
            { path: 'bs-element', loadChildren: './bs-element/bs-element.module#BsElementModule' },
            { path: 'grid', loadChildren: './grid/grid.module#GridModule' },
            { path: 'components', loadChildren: './bs-component/bs-component.module#BsComponentModule' },
            { path: 'blank-page', loadChildren: './blank-page/blank-page.module#BlankPageModule' },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LayoutRoutingModule { }
