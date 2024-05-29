import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller({
  path: 'dashboards/:dashboard/cards',
  version: '1',
})
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  createCard(
    @Param('dashboard') dashboard: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardService.createCard(dashboard, createCardDto);
  }

  @Get()
  cards(@Param('dashboard') dashboard: string) {
    return this.cardService.cards(dashboard);
  }

  @Get(':card')
  card(@Param('dashboard') dashboard: string, @Param('card') card: string) {
    return this.cardService.card(dashboard, card);
  }

  @Patch(':card')
  updateCard(
    @Param('dashboard') dashboard: string,
    @Param('card') card: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardService.updateCard(dashboard, card, updateCardDto);
  }

  @Delete(':card')
  removeCard(
    @Param('dashboard') dashboard: string,
    @Param('card') card: string,
  ) {
    return this.cardService.removeCard(dashboard, card);
  }
}
