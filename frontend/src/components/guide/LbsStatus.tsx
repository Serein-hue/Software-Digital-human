import { MapPin, Navigation, Wifi, WifiOff } from 'lucide-react'

interface Props {
  spotName: string
  distance: number
  online: boolean
}

export default function LbsStatus({ spotName, distance, online }: Props) {
  return (
    <div className="lbs-bar">
      <div className="lbs-left">
        <MapPin size={15} />
        <span className="lbs-spot">{spotName}</span>
        <span className="lbs-dist">{distance}m</span>
      </div>
      <div className="lbs-right">
        <Navigation size={13} />
        <span>LBS 已激活</span>
        {online ? (
          <span className="lbs-online"><Wifi size={12} /></span>
        ) : (
          <span className="lbs-offline"><WifiOff size={12} /> 弱网模式</span>
        )}
      </div>
    </div>
  )
}
