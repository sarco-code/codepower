import { Router } from "express";
import {
  createAdmin,
  deleteUser,
  listUsers,
  updateUserRole
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/users", listUsers);
router.post("/users/admin", createAdmin);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
