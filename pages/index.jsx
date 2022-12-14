import Link from 'next/Link'

function Header({ title }) {
  return <h1>{title ? title : "CDiD"}</h1>
}

export default function HomePage(App) {

  return (
    <>
      <div className="header">
        <div className="header-left">
            <img loading="lazy" src="/images/logo.png" className="logo" />
            <div className="header-title">Identidade Digital</div>
        </div>
        <div className="header-right">
          <Link href="/dashboard">Começe por aqui</Link>
        </div>
      </div>

      <div>
          <Link href="/samples/verifier">Verificador de exemplo</Link>
      </div>
    </>
  )
}