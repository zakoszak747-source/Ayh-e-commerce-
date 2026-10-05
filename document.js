/* AYH Boutique : images du bon de commande et du reçu (canvas, sans bibliothèque). */
(function () {
  var NUIT = '#14213d', AMB = '#f4b400', GRIS = '#46536b', VERT = '#0f7a40';
  var F = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';

  function fcfa(n) {
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') + '\u00A0FCFA';
  }
  function dateFr(v) {
    var d = new Date(v);
    return isNaN(d) ? '' : d.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /* type : 'commande' ou 'recu'. d : {ref, nom, tel, lieu, paiement, date, dateRecu, lignes:[{nom,q,pu}], total, montant, transaction}. b : boutique. */
  function dessiner(type, d, b) {
    b = b || {};
    var recu = type === 'recu', L = 1080, M = 56, lignes = d.lignes || [];
    var c = document.createElement('canvas');
    c.width = L;
    c.height = 1900 + 140 * lignes.length;
    var x = c.getContext('2d'), y = 0;

    function T(t, px, py, font, col, al) {
      x.font = font; x.fillStyle = col; x.textAlign = al || 'left'; x.textBaseline = 'alphabetic';
      x.fillText(t, px, py);
    }
    function W(t, px, py, mw, font, col, lh) {
      x.font = font;
      var mots = String(t).split(' '), ln = '', n = 0;
      mots.forEach(function (m) {
        var essai = ln ? ln + ' ' + m : m;
        if (x.measureText(essai).width > mw && ln) { T(ln, px, py + n * lh, font, col); ln = m; n++; } else { ln = essai; }
      });
      T(ln, px, py + n * lh, font, col);
      return n + 1;
    }
    function etiq(px, py, w, h, col) {
      x.fillStyle = col; x.beginPath();
      x.moveTo(px + h / 2, py); x.lineTo(px + w, py); x.lineTo(px + w, py + h); x.lineTo(px + h / 2, py + h); x.lineTo(px, py + h / 2);
      x.closePath(); x.fill();
    }

    x.fillStyle = '#fff'; x.fillRect(0, 0, L, c.height);
    x.fillStyle = NUIT; x.fillRect(0, 0, L, 190);
    etiq(M, 45, 150, 100, AMB);
    T('AYH', M + 88, 110, '800 38px ' + F, NUIT, 'center');
    T(b.nom || 'AYH Boutique', M + 190, 108, '800 50px ' + F, AMB);

    y = 280;
    T(recu ? 'REÇU DE PAIEMENT' : 'BON DE COMMANDE', M, y, '800 56px ' + F, NUIT);
    y += 52; T('Référence : ' + (d.ref || ''), M, y, '600 30px ' + F, GRIS);
    y += 42; T(dateFr(recu && d.dateRecu ? d.dateRecu : d.date), M, y, '400 28px ' + F, GRIS);
    y += 56;

    var infos = [['Nom', d.nom], ['Numéro', d.tel], ['Livraison', d.lieu]];
    if (!recu && d.paiement) infos.push(['Paiement', d.paiement]);
    if (recu && d.transaction) infos.push(['Transaction', d.transaction]);
    infos.forEach(function (r) {
      T(r[0], M, y, '600 26px ' + F, GRIS);
      var n = W(r[1] || '', M + 250, y, L - M - (M + 250), '700 30px ' + F, NUIT, 38);
      y += Math.max(n * 38, 38) + 14;
    });

    y += 10; x.fillStyle = NUIT; x.fillRect(M, y, L - 2 * M, 3); y += 52;
    T('Article', M, y, '700 26px ' + F, GRIS);
    T('Qté', 520, y, '700 26px ' + F, GRIS, 'center');
    T('Prix', 740, y, '700 26px ' + F, GRIS, 'right');
    T('Total', L - M, y, '700 26px ' + F, GRIS, 'right');
    y += 24;
    lignes.forEach(function (l) {
      y += 14;
      var n = W(l.nom || '', M, y + 30, 420, '600 30px ' + F, NUIT, 38);
      if (l.variante) { T(l.variante, M, y + 30 + n * 38 - 4, '400 24px ' + F, GRIS); n++; }
      T(String(l.q), 520, y + 30, '600 30px ' + F, NUIT, 'center');
      T(fcfa(l.pu), 740, y + 30, '400 28px ' + F, NUIT, 'right');
      if (l.unite) T('/ ' + l.unite, 740, y + 58, '400 22px ' + F, GRIS, 'right');
      T(fcfa(l.q * l.pu), L - M, y + 30, '700 30px ' + F, NUIT, 'right');
      y += Math.max(n * 38, l.unite ? 66 : 38) + 22;
      x.fillStyle = '#d5dbe4'; x.fillRect(M, y - 8, L - 2 * M, 2);
    });

    y += 50;
    var montant = recu && d.montant !== undefined && d.montant !== '' ? d.montant : d.total;
    etiq(L - M - 560, y, 560, 110, AMB);
    T(recu ? 'MONTANT PAYÉ' : 'TOTAL', L - M - 500, y + 44, '700 26px ' + F, NUIT);
    T(fcfa(montant), L - M - 24, y + 90, '800 46px ' + F, NUIT, 'right');
    y += 170;

    if (!recu) {
      y += 38 * W('Frais de livraison : à confirmer avec le vendeur (non inclus dans le total).', M, y, L - 2 * M, '600 28px ' + F, NUIT, 38) + 20;
      x.setLineDash([14, 10]); x.lineWidth = 4; x.strokeStyle = NUIT; x.strokeRect(M, y, L - 2 * M, 100); x.setLineDash([]);
      T('EN ATTENTE DE PAIEMENT', L / 2, y + 66, '800 40px ' + F, NUIT, 'center');
      y += 160;
      y += 34 * W('Ce document n\u2019est pas un reçu. Le reçu est remis après confirmation du paiement. Ne partage jamais ton code PIN.', M, y, L - 2 * M, '400 26px ' + F, GRIS, 34);
    } else {
      x.save(); x.translate(L / 2, y + 70); x.rotate(-0.12);
      x.strokeStyle = VERT; x.lineWidth = 10; x.strokeRect(-200, -70, 400, 140);
      T('PAYÉ', 0, 28, '800 90px ' + F, VERT, 'center');
      x.restore();
      y += 200;
      T('Merci pour votre achat', L / 2, y, '700 36px ' + F, NUIT, 'center');
      y += 60;
      y += 34 * W('Conserve ce reçu. Le numéro de transaction Mobile Money fait foi.', M, y, L - 2 * M, '400 26px ' + F, GRIS, 34);
    }
    y += 50;
    var out = document.createElement('canvas');
    out.width = L; out.height = y;
    out.getContext('2d').drawImage(c, 0, 0, L, y, 0, 0, L, y);
    return out;
  }

  function telecharger(cv, nom) {
    cv.toBlob(function (bl) {
      var u = URL.createObjectURL(bl), a = document.createElement('a');
      a.href = u; a.download = nom;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }, 'image/png');
  }

  function partager(cv, nom, texte) {
    cv.toBlob(function (bl) {
      var f = null;
      try { f = new File([bl], nom, { type: 'image/png' }); } catch (e) {}
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: nom, text: texte || '' }).catch(function () {});
      } else {
        telecharger(cv, nom);
      }
    }, 'image/png');
  }

  window.AYHDoc = { dessiner: dessiner, telecharger: telecharger, partager: partager, fcfa: fcfa };
})();
