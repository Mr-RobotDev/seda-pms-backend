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
import { IsObjectIdPipe } from 'nestjs-object-id';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller({
  path: 'dashboards/:dashboard/cards',
  version: '1',
})
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.OK)
  createCard(
    @Param('dashboard', IsObjectIdPipe) dashboard: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardService.createCard(dashboard, createCardDto);
  }

  @Get()
  cards(@Param('dashboard', IsObjectIdPipe) dashboard: string) {
    return this.cardService.cards(dashboard);
  }

  @Get(':card')
  card(
    @Param('dashboard', IsObjectIdPipe) dashboard: string,
    @Param('card', IsObjectIdPipe) card: string,
  ) {
    return this.cardService.card(dashboard, card);
  }

  @Roles(Role.ADMIN)
  @Patch(':card')
  updateCard(
    @Param('dashboard', IsObjectIdPipe) dashboard: string,
    @Param('card', IsObjectIdPipe) card: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardService.updateCard(dashboard, card, updateCardDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':card')
  removeCard(
    @Param('dashboard', IsObjectIdPipe) dashboard: string,
    @Param('card', IsObjectIdPipe) card: string,
  ) {
    return this.cardService.removeCard(dashboard, card);
  }
}
