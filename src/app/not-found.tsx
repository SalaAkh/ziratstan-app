import Link from 'next/link';

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem',
            }}
        >
            <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🪦</div>
            <h1
                style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: '0.75rem',
                }}
            >
                404
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                Страница или профиль не найдены
            </p>
            <Link
                href="/"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.75rem',
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    borderRadius: '10px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                }}
            >
                ← На главную
            </Link>
        </div>
    );
}
