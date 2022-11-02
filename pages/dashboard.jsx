
import Link from 'next/Link'

function Header({ title }) {
  return <h1>{title ? title : "CDiD"}</h1>
}

export default function Dashboard(App) {

  return (
    <>
      <div className="header hidden">
        <div className="header-left">
            <img loading="lazy" src="/images/logo.png" className="logo" />
            <div className="header-title">Identidade Digital</div>
        </div>
        <div className="header-right">
          <Link href="/dashboard">Começe por aqui</Link>
        </div>
      </div>
    </>
  )
}