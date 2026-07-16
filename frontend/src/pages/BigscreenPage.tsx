import DataDashboard from '../components/admin/DataDashboard'
import { Layout } from '../components/Layout'

export default function BigscreenPage() {
  return (
    <Layout currentPage="bigscreen" title="数据大屏">
      <DataDashboard />
    </Layout>
  )
}
