import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import { useCachedSession } from "./use-cached-session";

const authPages = ["/login", "/register"];

export function useAuthRedirect() {
  const session = useCachedSession();
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    if (!session.isPending && session.data && authPages.includes(location.pathname)) {
      navigate("/");
    } else if (!session.isPending && !session.data && !authPages.includes(location.pathname)) {
      navigate("/login");
    }
  });
}
