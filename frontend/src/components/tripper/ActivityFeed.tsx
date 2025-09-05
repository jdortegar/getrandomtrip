export default function ActivityFeed() {
  const activities = [
    { id: 1, text: 'Ruta "Aventura en la Patagonia" aprobada por QA.', time: 'Hace 2 horas' },
    { id: 2, text: 'Nuevo review de 5 estrellas en "Ruta del Café".', time: 'Ayer' },
    { id: 3, text: 'Liquidación de Septiembre marcada como "scheduled".', time: 'Hace 3 días' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="text-lg font-semibold text-neutral-600 mb-4">Actividad Reciente</h3>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id} className="mb-3 pb-3 border-b border-neutral-100 last:border-b-0 last:mb-0 last:pb-0">
            <p className="text-neutral-800">{activity.text}</p>
            <span className="text-sm text-neutral-500">{activity.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
