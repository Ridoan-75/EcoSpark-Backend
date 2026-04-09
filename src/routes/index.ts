import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { userRoutes } from "../modules/user/user.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },

  { path: "/users", route: userRoutes },
  // { path: "/categories", route: categoryRoutes },
  // { path: "/ideas", route: ideaRoutes },
  // { path: "/votes", route: voteRoutes },
  // { path: "/comments", route: commentRoutes },
  // { path: "/payments", route: paymentRoutes },
  // { path: "/newsletter", route: newsletterRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
