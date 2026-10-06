import OrdersPanel from '../../components/OrdersPanel.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminOrders() {
  return (
    <div>
      <PageHeader title="Orders" subtitle="All orders on the platform — update a status only when required" />
      <OrdersPanel role="admin" />
    </div>
  );
}
