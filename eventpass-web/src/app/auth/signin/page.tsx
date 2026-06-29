import SignInForm from "./SignInForm";

export const metadata = { title: "Sign in — EventPass" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; created?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <SignInForm
      callbackUrl={params.callbackUrl ?? "/"}
      created={params.created === "1"}
      defaultEmail={params.email}
    />
  );
}
