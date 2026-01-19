"use client";

import { api } from "~/trpc/react";

export function HelloMessage() {
  const [hello] = api.post.hello.useSuspenseQuery({ text: "from tRPC" });

  return (
    <div className="w-full max-w-xs">
      <p className="text-center text-2xl">
        {hello ? hello.greeting : "Loading..."}
      </p>
    </div>
  );
}
