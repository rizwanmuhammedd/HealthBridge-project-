const fs = require('fs');
const path = 'c:/Users/risva/OneDrive/Documents/Desktop/hospital/hospitalms-frontend/src/pages/Home.tsx';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Keep everything before line 511 (index 510)
const topLines = lines.slice(0, 510);

const newUI = `  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif', color: '#333333' }}>
      <style>{\`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        .standard-container { max-width: 1140px; margin: 0 auto; padding: 0 20px; }
        .nav-link { color: #555555; font-size: 15px; padding: 8px 0; margin-right: 24px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #004085; }
        .btn-primary { background-color: #004085; color: #ffffff; border: none; padding: 10px 20px; font-size: 15px; cursor: pointer; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s; }
        .btn-primary:hover { background-color: #002752; }
        .btn-secondary { background-color: #ffffff; color: #004085; border: 1px solid #004085; padding: 10px 20px; font-size: 15px; cursor: pointer; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s; }
        .btn-secondary:hover { background-color: #f8f9fa; }
        .card { background: #ffffff; border: 1px solid #dee2e6; border-radius: 6px; padding: 24px; transition: box-shadow 0.2s; }
        .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .section-title { font-size: 28px; color: #004085; margin-bottom: 32px; font-weight: bold; border-bottom: 2px solid #004085; padding-bottom: 10px; display: inline-block; }
        .section-bg { background-color: #ffffff; padding: 60px 0; border-bottom: 1px solid #e9ecef; }
        .section-alt { background-color: #f8f9fa; padding: 60px 0; border-bottom: 1px solid #e9ecef; }
      \`}</style>

      {/* HEADER */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="standard-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
          
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <div style={{ backgroundColor: '#004085', color: '#ffffff', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
              <Activity size={24} />
            </div>
            <div>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#004085', letterSpacing: '0.5px' }}>HEALTHBRIDGE</span>
              <div style={{ fontSize: '10px', color: '#6c757d', letterSpacing: '1px' }}>CLINICAL EXCELLENCE</div>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center' }}>
            <a href="#departments" className="nav-link">Departments</a>
            <a href="#doctors" className="nav-link">Doctors</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#beds" className="nav-link">Beds Status</a>
          </nav>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAuth ? (
              <>
                <div style={{ fontSize: '14px', color: '#333333' }}>
                  Welcome, <b>{user?.fullName?.split(' ')[0]}</b> ({user?.role})
                </div>
                <button onClick={() => navigate(getRoleRoute())} className="btn-secondary">
                  <LayoutDashboard size={16} /> Dashboard
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn-secondary">
                  <LogIn size={16} /> Login
                </button>
                <button onClick={() => navigate('/login')} className="btn-primary">
                  <UserPlus size={16} /> Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ backgroundColor: '#004085', color: '#ffffff', padding: '80px 0' }}>
        <div className="standard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.2' }}>Providing Professional & Reliable Healthcare</h1>
            <p style={{ fontSize: '18px', color: '#d1e4f3', marginBottom: '30px', lineHeight: '1.6' }}>
              HealthBridge is a comprehensive and integrated hospital management system designed to deliver the highest standard of patient care.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => openBook()} className="btn-primary" style={{ backgroundColor: '#ffffff', color: '#004085' }}>
                <Calendar size={18} /> Book Appointment
              </button>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#ffffff', color: '#333333', padding: '30px', borderRadius: '6px', width: '350px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', color: '#004085', borderBottom: '1px solid #e9ecef', paddingBottom: '10px', marginBottom: '20px' }}>Current Hospital Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>Registered Doctors</span>
                <b style={{ fontSize: '18px' }}>{loading ? '...' : (stats.totalDoctors ?? doctors.length)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>Daily Appointments</span>
                <b style={{ fontSize: '18px' }}>{loading ? '...' : (stats.totalAppointments ?? '—')}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>Active Departments</span>
                <b style={{ fontSize: '18px' }}>{loading ? '...' : (stats.totalDepartments ?? departments.length)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2f0d9', padding: '10px', borderRadius: '4px' }}>
                <span style={{ fontSize: '14px', color: '#385723', fontWeight: 'bold' }}>Available Beds</span>
                <b style={{ fontSize: '18px', color: '#385723' }}>{loading ? '...' : (stats.availableBeds ?? availCount)}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS SECTION */}
      <section id="departments" className="section-bg">
        <div className="standard-container">
          <h2 className="section-title">Medical Departments</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {departments.map((d) => (
              <div key={d.id} className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => openBook(d.id)}>
                <div style={{ backgroundColor: '#f1f5f9', width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} color="#004085" />
                </div>
                <h3 style={{ fontSize: '16px', color: '#333333', marginBottom: '8px' }}>{d.name}</h3>
                <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>{d.description ? d.description.slice(0, 50) + '...' : 'Specialized medical services.'}</p>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#004085' }}>Book Appointment &raquo;</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS SECTION */}
      <section id="doctors" className="section-alt">
        <div className="standard-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Our Specialists</h2>
            <button onClick={() => openBook()} className="btn-secondary">View All Doctors</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {doctors.map((doc) => (
              <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004085', fontSize: '20px', fontWeight: 'bold' }}>
                  {doc.profileImageUrl ? (
                    <img src={doc.profileImageUrl.startsWith('http') ? doc.profileImageUrl : \`\${BASE}\${doc.profileImageUrl}\`} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    (doc.fullName || 'D').charAt(0)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', color: '#004085', marginBottom: '4px' }}>{doc.fullName}</h3>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>{doc.specialization}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: doc.isAvailable !== false ? '#d4edda' : '#f8d7da', color: doc.isAvailable !== false ? '#155724' : '#721c24', borderRadius: '4px' }}>
                      {doc.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                    {doc.consultationFee && <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{doc.consultationFee}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="section-bg">
        <div className="standard-container">
          <h2 className="section-title">Core Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { icon: Calendar, title: 'Appointment Scheduling', desc: 'Manage out-patient scheduling and queue management smoothly.' },
              { icon: Pill, title: 'Pharmacy & Dispensing', desc: 'Centralized inventory and e-prescription processing.' },
              { icon: FlaskConical, title: 'Laboratory Management', desc: 'Standardized workflows for diagnostic tests and results logging.' },
              { icon: BedDouble, title: 'In-Patient Department', desc: 'Ward tracking, bed allocation, and daily room billing operations.' },
              { icon: Users, title: 'Staff Administration', desc: 'Access control and duty rosters for nurses, physicians, and admins.' },
              { icon: Shield, title: 'Data Security', desc: 'Enterprise-grade patient data protection and compliance records.' },
            ].map((srv, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', gap: '16px' }}>
                <div style={{ marginTop: '4px' }}><srv.icon color="#004085" size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '16px', color: '#333333', marginBottom: '8px' }}>{srv.title}</h4>
                  <p style={{ fontSize: '14px', color: '#6c757d', lineHeight: '1.5' }}>{srv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEDS SECTION */}
      <section id="beds" className="section-alt">
        <div className="standard-container">
          <h2 className="section-title">Live Bed Tracking</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {availBeds.map(bed => {
              const bColor = bed.status === 'Available' ? '#155724' : (bed.status === 'Occupied' ? '#721c24' : '#856404');
              const bBg = bed.status === 'Available' ? '#d4edda' : (bed.status === 'Occupied' ? '#f8d7da' : '#fff3cd');
              const bBorder = bed.status === 'Available' ? '#c3e6cb' : (bed.status === 'Occupied' ? '#f5c6cb' : '#ffeeba');
              return (
                <div key={bed.id} style={{ backgroundColor: '#ffffff', border: \`1px solid \${bBorder}\`, borderRadius: '4px', padding: '16px', borderLeft: \`4px solid \${bColor}\` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <b style={{ fontSize: '16px', color: '#333333' }}>{bed.bedNumber}</b>
                    <span style={{ fontSize: '12px', backgroundColor: bBg, color: bColor, padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' }}>{bed.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>{bed.wardType} Ward</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#1a1a1a', color: '#ffffff', padding: '40px 0', fontSize: '14px' }}>
        <div className="standard-container" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333333', paddingBottom: '30px', marginBottom: '20px' }}>
          <div style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
               <Activity size={20} />
               <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>HEALTHBRIDGE</span>
            </div>
            <p style={{ color: '#aaaaaa', lineHeight: '1.6' }}>Standardized enterprise software providing comprehensive hospital management infrastructure.</p>
          </div>
          <div style={{ display: 'flex', gap: '60px' }}>
            <div>
              <b style={{ display: 'block', marginBottom: '16px', color: '#ffffff' }}>Links</b>
              <div style={{ color: '#aaaaaa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span>Appointments</span>
                <span>Doctors Roster</span>
                <span>System Analytics</span>
              </div>
            </div>
            <div>
              <b style={{ display: 'block', marginBottom: '16px', color: '#ffffff' }}>Contact Details</b>
              <div style={{ color: '#aaaaaa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span>Phone: +1 800 555 1234</span>
                <span>Email: support@healthbridge.com</span>
                <span>123 Medical Plaza, Metro City</span>
              </div>
            </div>
          </div>
        </div>
        <div className="standard-container" style={{ color: '#777777', display: 'flex', justifyContent: 'space-between' }}>
          <span>&copy; 2026 HealthBridge International. All rights strictly reserved.</span>
          <span>Enterprise Edition v1.0.0</span>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      <BookModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        departments={departments}
        token={token}
        userId={user?.userId ?? user?.id}
        isAuthenticated={isAuth}
        initialDeptId={initDept}
      />
    </div>
  );
};

export default Home;
`;

const finalContent = topLines.join('\\n') + '\\n' + newUI;
fs.writeFileSync(path, finalContent);
console.log('UI updated successfully!');
