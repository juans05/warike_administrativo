// Panel typography (Inter only) for login/activation; see .panel-ui in globals.css.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="panel-ui">{children}</div>;
}
