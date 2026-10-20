import { NBButton, NBPanel } from "@/components/nb";
import logo from "@/assets/logo.svg";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="nb-dots flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <NBPanel className="max-w-md p-8 text-center nb-shadow-lg">
        <img
          src={logo}
          alt="ShiftedTone"
          width={56}
          height={56}
          className="nb mx-auto size-14 bg-ink"
        />
        <h1 className="mt-6 font-display text-6xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't find that page. Head home or open the app to keep going.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/">
            <NBButton variant="sun">Back home</NBButton>
          </Link>
          <Link to="/dashboard">
            <NBButton variant="paper">Open app</NBButton>
          </Link>
        </div>
      </NBPanel>
    </main>
  );
}
