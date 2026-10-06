import OrdersPanel from '../../components/OrdersPanel.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function FarmerOrders() {
  return (
    <div>
      <PageHeader title="Orders" subtitle="Accept or reject new orders, then update their progress" />
      <OrdersPanel role="farmer" />
    </div>
  );
}
