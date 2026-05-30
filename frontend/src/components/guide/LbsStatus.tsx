import { MapPin, Navigation, Wifi, WifiOff } from 'lucide-react'
import { useT } from '../../i18n'

interface Props {
  spotName: string
  distance: number
  online: boolean
}

export default function LbsStatus({ spotName, distance, online }: Props) {
  const t = useT()
  return (
    <div className="lbs-bar">
      <div className="lbs-left">
        <MapPin size={15} />
        <span className="lbs-spot">{spotName}</span>
        <span className="lbs-dist">{distance}m</span>
      </div>
      <div className="lbs-right">
        <Navigation size={13} />
        <span>{t('guide.lbsActive')}</span>
        {online ? (
          <span className="lbs-online"><Wifi size={12} /></span>
        ) : (
          <span className="lbs-offline"><WifiOff size={12} /> {t('guide.offlineMode')}</span>
        )}
      </div>
    </div>
  )
}
