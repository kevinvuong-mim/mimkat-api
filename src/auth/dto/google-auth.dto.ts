export class GoogleAuthDto {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  accessToken: string;
  refreshToken?: string;
}
