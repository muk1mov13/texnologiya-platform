import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router";
import { useCurrentUser, useLogoutAndRedirect, useSession } from "@/api/auth";
import type { User } from "@/api/types";
import { homePathFor } from "@/app/paths";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/paths";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/button-classes";
import { cx } from "@/lib/cx";
import { AuthCard } from "./AuthCard";
import { AUTH_LINK, AUTH_SUBMIT } from "./authStyles";

/** Tasdiq jarayonining bosqichlari: ro'yxatdan o'tish bajarilgan, hozir admin tasdig'i. */
const STEPS: {
  key: string;
  icon: IconName;
  state: "done" | "current" | "next";
}[] = [
  { key: "registered", icon: "check", state: "done" },
  { key: "review", icon: "clock", state: "current" },
  { key: "access", icon: "lock", state: "next" },
];

export function PendingPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const logout = useLogoutAndRedirect();
  const session = useSession();
  const navigate = useNavigate();

  // "Holatni tekshirish" aniq natijalarga ega bo'lishi uchun `invalidateQueries` o'rniga
  // lokal mutatsiya ishlatiladi: `session.refetch()` natijasini o'zi tekshiradi va
  // muvaffaqiyatsizlikda xatoni uloqtiradi (shunda `check.isError`/`check.error` ishlaydi).
  const check = useMutation({
    mutationFn: async (): Promise<User | null> => {
      const result = await session.refetch();
      if (result.isError) throw result.error;
      return result.data ?? null;
    },
    // meta.silent yo'q — xato global toast orqali ko'rsatiladi (api/queryClient.ts).
  });

  if (user && user.status === "active")
    return <Navigate to={homePathFor(user)} replace />;

  const stillPendingText =
    check.isSuccess && check.data?.status === "pending"
      ? t("pending.stillPending")
      : "";

  return (
    <AuthCard
      title={t("pending.title")}
      subtitle={t("pending.subtitle")}
      variant="pending"
      footer={
        user ? (
          <button
            type="button"
            onClick={logout.logout}
            disabled={logout.isPending}
            className={cx(AUTH_LINK, "disabled:opacity-60")}
          >
            {t("nav.logout")}
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        <p className="leading-relaxed text-slate-600">
          {user
            ? t("pending.textUser", { name: user.full_name })
            : t("pending.textGuest")}
        </p>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step) => (
            <li
              key={step.key}
              className="flex items-center gap-3 text-sm font-semibold"
            >
              <span
                className={cx(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
                  step.state === "done" &&
                    "bg-emerald-50 text-emerald-600 ring-emerald-200",
                  step.state === "current" &&
                    "bg-brand-50 text-brand-700 ring-brand-200",
                  step.state === "next" &&
                    "bg-slate-50 text-slate-400 ring-slate-200",
                )}
              >
                <Icon
                  name={step.icon}
                  className={cx(
                    "size-4",
                    step.state === "current" &&
                      "animate-pulse motion-reduce:animate-none",
                  )}
                />
              </span>
              <span
                className={
                  step.state === "next" ? "text-slate-400" : "text-slate-800"
                }
              >
                {t(`pending.steps.${step.key}`)}
              </span>
            </li>
          ))}
        </ol>
        {/* Doim DOM'da turadi — faqat matn almashadi, shunda ekran o'quvchi o'zgarishni e'lon qiladi.
            Bo'sh bo'lganda `sr-only`: ko'rinmaydi va joy egallamaydi, lekin live region sifatida qoladi. */}
        <p
          role="status"
          className={cx(
            stillPendingText
              ? "rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200"
              : "sr-only",
          )}
        >
          {stillPendingText}
        </p>
        {user ? (
          <Button
            loading={check.isPending}
            className={AUTH_SUBMIT}
            onClick={() =>
              check.mutate(undefined, {
                // Call-level callback: komponent unmount bo'lgach chaqirilmaydi — kechikkan
                // javob allaqachon boshqa sahifaga o'tgan foydalanuvchini qaytarib yubormaydi.
                onSuccess: (data) => {
                  // `null` — sessiya tugagan (masalan, rad etilgan foydalanuvchi bloklangan va
                  // refresh 401/403 qaytargan — ikkisi ham `client.ts`da `null`ga tushadi).
                  if (data === null)
                    navigate("/login", { replace: true, flushSync: true });
                },
              })
            }
          >
            {t("pending.check")}
          </Button>
        ) : (
          <Link
            to="/login"
            className={cx(buttonClasses("primary"), AUTH_SUBMIT)}
          >
            {t("nav.login")}
            <Icon
              name="arrowRight"
              className="size-5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        )}
      </div>
    </AuthCard>
  );
}
