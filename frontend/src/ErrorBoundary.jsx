import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('RxLens render error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'2rem', textAlign:'center', maxWidth:480, margin:'4rem auto'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>⚠️</div>
          <h2 style={{marginBottom:'0.75rem'}}>Something went wrong displaying the result.</h2>
          <p style={{color:'#64748b',marginBottom:'1.5rem',lineHeight:1.6}}>
            The scan returned an unexpected format. {this.state.error && this.state.error.toString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{padding:'0.75rem 1.5rem',background:'#6366f1',color:'white',border:'none',borderRadius:'12px',cursor:'pointer',fontWeight:600}}
          >
            Refresh App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
