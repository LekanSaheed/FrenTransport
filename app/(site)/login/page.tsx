import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/layout/Container";
import { LoadingBlock } from "@/components/ui/feedback";
import { LoginForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Page() {
  return (
    <Container className="mb-24">
      <Suspense fallback={<LoadingBlock />}>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
