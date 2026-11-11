import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <BuddyAvatar mood="oops" size={72} />
      <h1 className="mt-4 font-display text-3xl font-semibold">This page wandered off</h1>
      <p className="mt-2 text-ink-2">Let&apos;s get you back to studying.</p>
      <ButtonLink variant="primary" href="/" className="mt-6">
        Back home
      </ButtonLink>
    </div>
  );
}
