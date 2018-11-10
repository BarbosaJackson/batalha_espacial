function collide(s1, s2){
	var hit = false;
	// calcula a distancia entre o centro dos sprites
	var vetX = s1.centerX() - s2.centerX()-20;
	var vetY = s1.centerY() - s2.centerY()-20;
	
	// Armazenar as somas das metades dos spritesna largura e na altura
	var sumHalfWidth = s1.halfWidth() + s2.halfWidth();
	var sumHalfHeight = s1.halfHeight() + s2.halfHeight();
	
	// verifica se houve colisão
	if(Math.abs(vetX) < sumHalfWidth && Math.abs(vetY) < sumHalfHeight){
		hit = true;
	}
	return hit;
}