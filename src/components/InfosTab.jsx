export default function InfosTab({ trip }) {
  if (!trip) return null

  return (
    <div>
      {trip.accommodation && (
        <div className="info-card">
          <h3>🏕 Hébergement</h3>
          <ul>
            <li><strong>{trip.accommodation}</strong></li>
            {trip.accommodationPhone && (
              <li>Tél : <a href={`tel:${trip.accommodationPhone}`}>{trip.accommodationPhone}</a></li>
            )}
            <li>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(trip.accommodation)}`}
                target="_blank" rel="noreferrer">→ Google Maps</a>
            </li>
          </ul>
        </div>
      )}

      <div className="info-card">
        <h3>📞 Urgences & Contacts</h3>
        <ul>
          <li><strong>PGHM Savoie</strong> : +33 4 79 08 30 44</li>
          <li><strong>Urgences</strong> : 15 ou 112</li>
          <li><strong>Altibus</strong> : +33 4 79 68 32 96 · Urgences : +33 4 79 07 04 49</li>
          <li><strong>Mutuaide 24h/7j</strong> : 01 55 98 71 84</li>
          <li>
            <strong>Météo live</strong> :{' '}
            <a href="https://www.valdisere.com/live/meteo-a-val-disere/" target="_blank" rel="noreferrer">
              valdisere.com/live →
            </a>
          </li>
        </ul>
      </div>

      <div className="info-card">
        <h3>🚌 Navettes gratuites</h3>
        <ul>
          <li><strong>Bus Jaune</strong> — Village ↔ Le Manchet</li>
          <li><strong>Bus Rouge</strong> — Village ↔ La Daille ↔ Le Fornet</li>
        </ul>
      </div>

      <div className="info-card">
        <h3>🚄 Trajet aller — Dim 5 juillet</h3>
        <ul>
          <li><strong>07h52</strong> Paris Gare de Lyon → <strong>12h15</strong> Chambéry · Voiture 5 · Siège 503</li>
          <li><strong>13h53</strong> Chambéry → <strong>15h45</strong> Bourg-Saint-Maurice</li>
          <li><strong>16h00</strong> Altibus BSM → <strong>16h45</strong> Val d'Isère · Réf : BSG6411704</li>
        </ul>
      </div>

      <div className="info-card">
        <h3>🚄 Trajet retour — Ven 10 juillet</h3>
        <ul>
          <li><strong>09h00</strong> Altibus Val d'Isère → <strong>09h40</strong> BSM · Se présenter avant 08h45</li>
          <li><strong>10h13</strong> BSM → <strong>11h15</strong> Albertville · <strong>11h25</strong> → <strong>12h57</strong> Chambéry</li>
          <li><strong>13h23</strong> TGV 6972 → <strong>16h16</strong> Paris · Voiture 8 · Siège 827 (fenêtre)</li>
        </ul>
      </div>

      <div className="info-card">
        <h3>🗺 Apps recommandées</h3>
        <ul>
          <li><strong>AllTrails</strong> — GPS + cartes hors-ligne</li>
          <li><strong>IGN Rando</strong> — carte 3633ET Tignes/Val d'Isère</li>
          <li><strong>Météo-France</strong> — prévisions heure par heure</li>
        </ul>
      </div>

      <div className="info-card">
        <h3>🛡 Assurance urgences</h3>
        <ul>
          <li><strong>Sinistre</strong> : <a href="https://sinistre.assurinco.com" target="_blank" rel="noreferrer">sinistre.assurinco.com</a></li>
          <li><strong>Assistance 24h/7j</strong> : Mutuaide <a href="tel:+33155987184">01 55 98 71 84</a></li>
        </ul>
      </div>
    </div>
  )
}
