import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import { env } from "@config/env";

export const isOAuthEnabled =
  Boolean(env.OAUTH_CLIENT_ID) &&
  Boolean(env.OAUTH_CLIENT_SECRET) &&
  Boolean(env.OAUTH_AUTH_URL) &&
  Boolean(env.OAUTH_TOKEN_URL) &&
  Boolean(env.OAUTH_CALLBACK_URL);

if (isOAuthEnabled) {
  passport.use(
    "oauth2",
    new OAuth2Strategy(
      {
        authorizationURL: env.OAUTH_AUTH_URL!,
        tokenURL: env.OAUTH_TOKEN_URL!,
        clientID: env.OAUTH_CLIENT_ID!,
        clientSecret: env.OAUTH_CLIENT_SECRET!,
        callbackURL: env.OAUTH_CALLBACK_URL!
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: unknown,
        done: (error: Error | null, user?: Express.User | object) => void
      ) => {
        return done(null, profile ?? {});
      }
    )
  );
}
