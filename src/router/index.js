import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import Management from "@/views/management/Management.vue";
import ManagementSeat from "@/views/management/ManagementSeat.vue";
import ManagementAirline from "@/views/management/ManagementAirline.vue";
import ManagementFlight from "@/views/management/ManagementFlight.vue";
import ManagementMenu from "@/views/management/ManagementMenu.vue";
import FinanceManagement from '@/views/management/FinanceManagement.vue';
import UserManagement from '@/views/management/UserManagement.vue';
import PassengerManagement from "@/views/management/PassengerManagement.vue"
import FlightReservation from "@/views/management/ReservationManagement.vue"
import AdminManagement from '@/views/AdminManagement.vue'
import ReportPage from '@/views/ReportPage.vue'
import ModifyUser from '@/views/ModifyUser.vue'
import Login from "@/views/Login.vue";
import Signup from '@/views/Signup.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { layout: false },
    },
    {
      path: '/signup',
      name: 'signup',
      component: Signup,
      meta: { layout: false },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: Dashboard,
    },
    {
      path: "/management",
      name: "management",
      component: Management,
      children: [
        {
          path: "menu",
          name: "management-menu",
          component: ManagementMenu,
        },
        {
          path: "airline",
          name: "management-airline",
          component: ManagementAirline,
          meta: { rolesAllowed: ['flightadmin', 'superadmin'] }
        },
        {
          path: ":airlineID/flight",
          name: "management-flight",
          component: ManagementFlight,
          meta: { rolesAllowed: ['flightadmin', 'superadmin'] }
        },
        {
          path: ":airlineID/flight/:flightID/seat",
          name: "management-seat",
          component: ManagementSeat,
          meta: { rolesAllowed: ['flightadmin', 'superadmin'] }
        },
        {
          path: 'finance',
          name: 'FinanceManagement',
          component: FinanceManagement,
          meta: { rolesAllowed: ['financeadmin', 'superadmin'] }
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: UserManagement,
          meta: { rolesAllowed: ['useradmin', 'superadmin'] }
        }, 
        {
          path: ":airlineID/flight/:flightID/passengers",
          name: "PassengerManagement",
          component: PassengerManagement,
          meta: { rolesAllowed: ['flightadmin', 'superadmin'] }
        },
        {
          path: ':airlineID/flight/:flightID/reservations',
          name: 'FlightReservation',
          component: FlightReservation,
          meta: { rolesAllowed: ['flightadmin', 'superadmin'] }
        }
      ],
    },
    {
      path: '/users/:id/edit',
      name: 'modify-user',
      component: ModifyUser,
      meta: { rolesAllowed: ['useradmin', 'superadmin'] }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportPage
    },
    { path: '/admin-management',
      name: 'admin-management',
      component: AdminManagement,
      meta: { rolesAllowed: ['superadmin'] } 
    }
  ],
});
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
  const role = payload.role?.toLowerCase() || payload.Role?.toLowerCase() || null;

  // If route has meta.rolesAllowed, enforce role restriction
  if (to.meta.rolesAllowed && !to.meta.rolesAllowed.includes(role)) {
    return next('/dashboard'); // Or redirect to unauthorized page
  }

  next(); // allow access
});

export default router ;
