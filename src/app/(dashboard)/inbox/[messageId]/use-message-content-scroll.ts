import { useEffect, useRef, useState } from "react";

export function useMessageContentScroll(messageId: string, loading: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setScrolled((scrollRef.current?.scrollTop ?? 0) > 0);
  }, [messageId, loading]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrolled(false);
  }, [messageId]);

  function handleScroll() {
    setScrolled((scrollRef.current?.scrollTop ?? 0) > 0);
  }

  return { scrollRef, scrolled, handleScroll };
}
