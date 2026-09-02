export type IRegisterStudent = {
  name: string;
  email: string;
  password: string;
  programId: string;
  admissionSemesterId: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  contactNo?: string;
};

export type ILoginUser = {
  email: string;
  password: string;
};

export type ILoginUserResponse = {
  accessToken: string;
  refreshToken: string;
  needPasswordChange: boolean;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

export type IGoogleLogin = {
  idToken: string;
  programId?: string;
  admissionSemesterId?: string;
};
