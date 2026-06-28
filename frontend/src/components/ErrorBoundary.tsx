import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { t } from '../i18n'

interface Props {
  children: React.ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <AlertTriangle size={32} />
          <h2>{t('error.title')}</h2>
          <p>{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            <RefreshCw size={16} />
            <span>{t('error.reload')}</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
