import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import Management from "@/views/management/Management.vue";
import ManagementSeat from "@/views/management/ManagementSeat.vue";
import ManagementAirline from "@/views/management/ManagementAirline.vue";
import ManagementAircraft from "@/views/management/ManagementAircraft.vue";
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
        },
        {
          path: "aircraft/:airlineID",
          name: "management-aircraft",
          component: ManagementAircraft,
        },
        {
          path: ":airlineID/flight",
          name: "management-flight",
          component: ManagementFlight,
        },
        {
          path: ":airlineID/flight/:flightID/seat",
          name: "management-seat",
          component: ManagementSeat,
        },
        {
          path: 'finance',
          name: 'FinanceManagement',
          component: FinanceManagement
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: UserManagement
        }, 
        {
          path: ":airlineID/flight/:flightID/passengers",
          name: "PassengerManagement",
          component: PassengerManagement
        },
        {
          path: ':airlineID/flight/:flightID/reservations',
          name: 'FlightReservation',
          component: FlightReservation
        }
      ],
    },
    {
      path: '/users/:id/edit',
      name: 'modify-user',
      component: ModifyUser
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportPage
    },
    { path: '/admin-management',
      name: 'admin-management',
      component: AdminManagement 
    }
  ],
});

export default router ;
