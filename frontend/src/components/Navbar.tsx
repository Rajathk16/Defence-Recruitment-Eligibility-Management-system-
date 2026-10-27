'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Target, FileText, User, Award, Database, Phone, Volume2, Globe } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ' | ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'simulator', label: 'Check Eligibility', hindi: 'पात्रता जांचें', icon: Target },
    { id: 'notifications', label: 'Notifications / Rallies', hindi: 'अधिसूचनाएं', icon: FileText },
    { id: 'candidate', label: 'Candidate Corner / Admit Card', hindi: 'उम्मीदवार कॉर्नर', icon: User },
    { id: 'officer', label: 'Officers Command & Merit List', hindi: 'चयन बोर्ड', icon: Award },
    { id: 'dbms', label: 'DBMS Project Viva Console', hindi: 'डेटाबेस समीक्षा', icon: Database },
  ];

  return (
    <header style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
      {/* 1. Indian National Tricolor Ribbon */}
      <div style={{ height: '4px', display: 'flex', width: '100%' }}>
        <div style={{ flex: 1, background: '#FF9933' }} />
        <div style={{ flex: 1, background: '#FFFFFF' }} />
        <div style={{ flex: 1, background: '#138808' }} />
      </div>

      {/* 2. Official Government of India Top Bar */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#334155', padding: '4px 0' }}>
        <div className="gov-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontWeight: 600 }}>भारत सरकार | Government of India</span>
            <span>•</span>
            <span style={{ color: '#64748b' }}>रक्षा मंत्रालय | Ministry of Defence</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={13} color="#64748b" />
              <span style={{ cursor: 'pointer', color: '#64748b' }}>Screen Reader Access</span>
            </div>
            <span>|</span>
            <div style={{ display: 'flex', gap: '6px', fontWeight: 600, color: '#475569' }}>
              <span style={{ cursor: 'pointer' }}>A-</span>
              <span style={{ cursor: 'pointer' }}>A</span>
              <span style={{ cursor: 'pointer' }}>A+</span>
            </div>
            <span>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0c3866', fontWeight: 700, cursor: 'pointer' }}>
              <Globe size={13} />
              <span>English / हिन्दी</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Indian Army Masthead */}
      <div style={{ background: '#ffffff', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="gov-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Emblem + Official Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Ashoka Emblem Placeholder / SVG */}
            <div style={{
              width: '54px',
              height: '58px',
              border: '2px solid #7b1113',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fef2f2',
              padding: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            }}>
              <Shield size={26} color="#7b1113" strokeWidth={2.2} />
              <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#7b1113', marginTop: '2px', textAlign: 'center', lineHeight: 1 }}>
                सत्यमेव जयते
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <h1 className="font-emblem" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#7b1113', letterSpacing: '0.04em' }}>
                  JOIN INDIAN ARMY
                </h1>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0c3866' }}>
                  भारतीय सेना में शामिल हों
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                Directorate General of Recruiting • Defence Recruitment & Eligibility Management System (DREMS)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Official Automated Armed Forces Examination, Physical Standard Screening & Merit Board
              </div>
            </div>
          </div>

          {/* Right Help Desk & Date */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '0.82rem', color: '#7b1113', fontWeight: 700 }}>
              <Phone size={14} />
              <span>Toll Free Helpline: 1800-11-2026</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>
              {currentDateTime || 'IST Standard Time'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
              {isSupabaseConfigured ? (
                <span className="stamp-badge stamp-eligible" style={{ fontSize: '0.68rem' }}>
                  ● Supabase PostgreSQL Live Connected
                </span>
              ) : (
                <span className="stamp-badge stamp-blue" style={{ fontSize: '0.68rem' }}>
                  ● PostgreSQL Engine Active (Simulation Mode)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Official Indian Army Red Navigation Bar */}
      <nav style={{ background: '#7b1113', borderBottom: '3px solid #c59b27' }}>
        <div className="gov-container" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 16px',
                  background: isActive ? '#580c0d' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #e6b83b' : '3px solid transparent',
                  marginBottom: isActive ? '-3px' : '0',
                  color: isActive ? '#ffffff' : '#fecdd3',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <Icon size={16} color={isActive ? '#fbbf24' : '#fecdd3'} />
                <div>
                  <div style={{ lineHeight: 1.1 }}>{item.label}</div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 400 }}>{item.hindi}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 5. Official Indian Army Flash News Ticker */}
      <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '6px 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
        <div className="gov-container" style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
          <div style={{
            background: '#b45309',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: '2px',
            marginRight: '12px',
            flexShrink: 0,
            letterSpacing: '0.04em',
          }}>
            FLASH NEWS
          </div>
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
            <div className="ticker-content" style={{ color: '#78350f', fontWeight: 600 }}>
              🔴 Online applications for National Defence Academy (NDA-154) and Combined Defence Services (CDS-II 2026) are active.
              &nbsp;&nbsp;•&nbsp;&nbsp;
              Aadhaar-based authentication and biometric verification are mandatory during physical rally.
              &nbsp;&nbsp;•&nbsp;&nbsp;
              Candidates are advised to simulate physical and age eligibility using the automated DREMS engine before submitting.
              &nbsp;&nbsp;•&nbsp;&nbsp;
              PostgreSQL stored triggers enforce automated rejection for overage and under-height applicants.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
