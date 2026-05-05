export type UserRole = "kid" | "parent" | "teacher";

export type SignUpUserInput = {
  email: string;
  password: string;
  role: UserRole;
};

export type SignInUserInput = {
  email: string;
  password: string;
};
