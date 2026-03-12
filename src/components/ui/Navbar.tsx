'use client'

import Link from 'next/link';
import { Map, QrCode, Wrench, Home, Search } from 'lucide-react';
import AuthButton from './AuthButton';

export default function Navbar() {
    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '0 1.5rem',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(9,9,11,0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Logo */}
            <Link
                href="/"
                style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    textDecoration: 'none',
                    color: 'var(--foreground)',
                }}
            >
                <span style={{ color: 'var(--accent)' }}>З</span>иратстан
            </Link>

            {/* Nav Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {[
                    { href: '/', icon: <Home size={16} />, label: 'Главная' },
                    { href: '/map', icon: <Map size={16} />, label: 'Карта' },
                    { href: '/search', icon: <Search size={16} />, label: 'Поиск' },
                    { href: '/services', icon: <Wrench size={16} />, label: 'Услуги' },
                    { href: '/admin/qr', icon: <QrCode size={16} />, label: 'QR' },
                ].map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            color: 'var(--muted)',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground)';
                            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)';
                            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                        }}
                    >
                        {link.icon}
                        <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                ))}
                <AuthButton />
            </nav>
        </header>
    );
}
