import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  // পরে এখানে একটা একটা করে add হবে
  // { path: "/users", route: userRoutes },
  // { path: "/categories", route: categoryRoutes },
  // { path: "/ideas", route: ideaRoutes },
  // { path: "/votes", route: voteRoutes },
  // { path: "/comments", route: commentRoutes },
  // { path: "/payments", route: paymentRoutes },
  // { path: "/newsletter", route: newsletterRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;