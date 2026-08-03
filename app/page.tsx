import { AptitudeApp } from "./AptitudeApp";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  if (!user) {
    return (
      <main className="sign-in-shell">
        <section className="sign-in-card">
          <span className="eyebrow">APTITUDE MAP</span>
          <h1>Your capability map, owned by you.</h1>
          <p>
            Sign in with ChatGPT to create a private set of answers and an
            editable ontology that only your account can access.
          </p>
          <a className="sign-in-button" href={chatGPTSignInPath("/")}>
            Sign in with ChatGPT
          </a>
        </section>
      </main>
    );
  }

  return (
    <AptitudeApp
      accountLabel={user.displayName}
      signOutHref={chatGPTSignOutPath("/")}
    />
  );
}
