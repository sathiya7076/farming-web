import OrdersPanel from '../../components/OrdersPanel.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function MyOrders() {
  return (
    <div>
      <PageHeader title="My Orders" subtitle="View, cancel and review your orders" />
      <OrdersPanel role="client" />
    </div>
  );
}
