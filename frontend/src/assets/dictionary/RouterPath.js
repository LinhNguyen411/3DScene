export const RouterPath = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/sign-up",
  SIGNUP_MAIL_SENT: "/sign-up/mail-sent",
  SIGNUP_CONFIRM_EMAIL: "/confirm-email",
  FORGOT_PASSWORD: "/forgot-password",
  FORGOT_PASSWORD_MAIL_SENT: "/password-forgot/mail-sent",
  RESET_PASSWORD: "/reset-password",
  PASSWORD_CHANGED: "/reset-password/password-changed",
  LINK_NOT_VALID: "/link-not-valid",
  LIST_TODOS: "/list-todos",
  LIST_DONE: "/list-done",
  MY_INFORMATION: "/my-information",
  MAILHOG: "/mailhog",
  FLOWER: "/flower",

  /* dashboard route */
  DASHBOARD: "/dashboard",
  DASHBOARD_UPLOAD: "/dashboard/upload",
  DASHBOARD_MY_MODEL: "/dashboard/my-model",
  DASHBOARD_3DGS: "/dashboard/3dgs",
  DASHBOARD_FAVORITES: "/dashboard/favorites",
  DASHBOARD_FEEDBACK: "/dashboard/feedback",
  
  MODEL_VIEW: "/model/view",

  // subscription route
  SUBSCRIPTION: "/subscription",
  SUCCESS:"/success",
  CANCEL: "/cancel",

  /* admin route */
  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USER: "/admin/users",
  ADMIN_SPLAT: "/admin/splats",
  ADMIN_PAYMENT: "/admin/payments",
  ADMIN_SETTINGS: "/admin/settings",
};
Object.freeze(RouterPath);
